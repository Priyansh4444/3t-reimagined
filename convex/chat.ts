import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Agent } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  ActionCtx,
  internalAction,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";

async function authorizeThreadAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  threadId: string,
) {
  const userId = await ctx.auth.getUserIdentity();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const thread = await ctx.runQuery(components.agent.threads.getThread, {
    threadId,
  });
  if (!thread) {
    throw new Error("Thread not found");
  }
  if (thread.userId !== userId.tokenIdentifier) {
    throw new Error("Unauthorized");
  }
  return thread;
}

// Updated Google models to use correct Gemini 2.5 model names
export const AVAILABLE_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
  },
  {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash-Lite",
    provider: "Google",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
  },
];

// Available interfaces
export const AVAILABLE_INTERFACES = [
  { id: "chat", name: "Chat", description: "Standard chat interface" },
  { id: "code", name: "Code", description: "Code-focused interface" },
  {
    id: "creative",
    name: "Creative",
    description: "Creative writing interface",
  },
  { id: "analysis", name: "Analysis", description: "Data analysis interface" },
];

const PROMPT = `You are CC Chat, an AI assistant powered by advanced language models. Your role is to assist and engage in conversation while being helpful, respectful, and engaging.
- Always use LaTeX for mathematical expressions:
    - Inline math must be wrapped in escaped parentheses: \\( content \\)
    - Do not use single dollar signs for inline math
    - Display math must be wrapped in double dollar signs: $$ content $$
- Do not use the backslash character to escape parenthesis. Use the actual parentheses instead.
- When generating code:
    - Ensure it is properly formatted using Prettier with a print width of 80 characters
    - Present it in Markdown code blocks with the correct language extension indicated`;

export const generateTitle = internalAction({
  args: { message: v.string(), threadId: v.string() },
  handler: async (ctx, { message, threadId }) => {
    const systemPrompt =
      "Generate a concise one-line title (max 6 words) for this conversation. Only return the title, no extra text.";
    const prompt = `Create a short title for: ${message}`;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt,
      maxTokens: 50,
    });

    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: {
        title: result.text.trim(),
      },
    });
  },
});

const chatAgent = new Agent(components.agent, {
  // Use Google AI SDK directly with Gemini 2.5 Flash for better performance and streaming
  chat: google("gemini-2.5-flash"),
  instructions: PROMPT,
});

export const streamChatAsynchronously = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);

    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.streamChat, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamChat = internalAction({
  args: {
    promptMessageId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { promptMessageId, threadId }) => {
    // Skip authorization for internal streaming - it's already authorized in the mutation
    const { thread } = await chatAgent.continueThread(ctx, { threadId });

    const result = await thread.streamText(
      { promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "word",
          throttleMs: 50,
        },
      },
    );
    await result.consumeStream();
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, paginationOpts }) => {
    await authorizeThreadAccess(ctx, threadId);

    // Get messages and streams with proper ordering
    return await chatAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
      excludeToolMessages: true,
    });
  },
});

export const createThreadWithFirstMessage = mutation({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("User not found");
    }
    const { threadId } = await chatAgent.createThread(ctx, {
      userId: user.tokenIdentifier,
      title: "Generating title...",
    });
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });

    // No authorization needed for title generation - it's the user's own thread
    void ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
      message: prompt,
      threadId,
    });
    void ctx.scheduler.runAfter(0, internal.chat.streamChat, {
      threadId,
      promptMessageId: messageId,
    });
    return { threadId, messageId };
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("User not found");
    }
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: user.tokenIdentifier,
      order: "desc",
      paginationOpts: { cursor: null, numItems: 20 },
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });
  },
});
