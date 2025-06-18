import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { Agent, vStreamArgs } from "@convex-dev/agent";
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
  console.log(`🔐 Authorizing thread access for: ${threadId}`);
  const userId = await ctx.auth.getUserIdentity();
  if (!userId) {
    console.log("❌ Unauthorized: No user identity");
    throw new Error("Unauthorized");
  }
  const thread = await ctx.runQuery(components.agent.threads.getThread, {
    threadId,
  });
  if (!thread) {
    console.log("❌ Thread not found");
    throw new Error("Thread not found");
  }
  if (thread.userId !== userId.tokenIdentifier) {
    console.log("❌ Unauthorized: User does not own thread");
    throw new Error("Unauthorized");
  }
  console.log("✅ Thread access authorized");
  return thread;
}

// Enhanced model list with OpenRouter free models and Google models
export const AVAILABLE_MODELS = [
  // Google Gemini models (premium)
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    free: false,
    apiProvider: "google",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    free: false,
    apiProvider: "google",
  },
  // OpenRouter Free Models
  {
    id: "qwen/qwen3-14b:free",
    name: "Qwen3 14B (Free)",
    provider: "Qwen",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "qwen/qwen3-8b:free",
    name: "Qwen3 8B (Free)",
    provider: "Qwen",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "qwen/qwen3-4b:free",
    name: "Qwen3 4B (Free)",
    provider: "Qwen",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B (Free)",
    provider: "Meta",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama 3.1 8B (Free)",
    provider: "Meta",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B (Free)",
    provider: "Google",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "microsoft/phi-4-reasoning:free",
    name: "Phi-4 Reasoning (Free)",
    provider: "Microsoft",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "DeepSeek",
    free: true,
    apiProvider: "openrouter",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B (Free)",
    provider: "Mistral AI",
    free: true,
    apiProvider: "openrouter",
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

function createModelProvider(modelId: string) {
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === modelId);

  if (!modelInfo) {
    console.log(`⚠️ Unknown model: ${modelId}, defaulting to Gemini`);
    return google("gemini-2.5-flash");
  }

  console.log(
    `🤖 Creating provider for: ${modelInfo.name} (${modelInfo.apiProvider})`,
  );

  if (modelInfo.apiProvider === "openrouter") {
    return openrouter(modelId);
  } else {
    // For Google models, use the base model name without provider prefix
    const baseModelId = modelId.includes("/")
      ? modelId.split("/").pop()
      : modelId;
    return google(baseModelId || "gemini-2.5-flash");
  }
}

export const generateTitle = internalAction({
  args: { message: v.string(), threadId: v.string() },
  handler: async (ctx, { message, threadId }) => {
    console.log(`🎯 Starting title generation for thread: ${threadId}`);
    console.log(`📝 Message preview: ${message.slice(0, 50)}...`);

    const systemPrompt =
      "Generate a concise one-line title (max 6 words) for this conversation. Only return the title, no extra text.";
    const prompt = `Create a short title for: ${message}`;

    try {
      console.log("🔄 Calling AI for title generation...");
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: systemPrompt,
        prompt,
        maxTokens: 50,
      });

      const generatedTitle = result.text.trim();
      console.log(`✨ Generated title: "${generatedTitle}"`);

      console.log("💾 Updating thread with new title...");
      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId,
        patch: {
          title: generatedTitle,
        },
      });
      console.log("✅ Title update completed successfully");
    } catch (error) {
      console.error("❌ Title generation failed:", error);
      // Fallback to a generic title
      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId,
        patch: {
          title: "New Chat",
        },
      });
    }
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
    console.log(`🚀 Starting async chat stream for thread: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);

    console.log("💬 Saving user message...");
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    });
    console.log(`✅ Message saved with ID: ${messageId}`);

    console.log("⏰ Scheduling streaming action...");
    await ctx.scheduler.runAfter(0, internal.chat.streamChat, {
      threadId,
      promptMessageId: messageId,
    });
    console.log("📅 Streaming scheduled successfully");

    return { messageId };
  },
});

export const streamChat = internalAction({
  args: {
    promptMessageId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { promptMessageId, threadId }) => {
    console.log(`🔄 Starting streaming for message: ${promptMessageId}`);
    // Skip authorization for internal streaming - it's already authorized in the mutation
    const { thread } = await chatAgent.continueThread(ctx, { threadId });

    console.log("🎭 Starting text streaming...");
    const result = await thread.streamText(
      { promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "word", // Faster chunking for better UX
          throttleMs: 25, // Reduced throttle for faster streaming
        },
      },
    );
    console.log("📡 Consuming stream...");
    await result.consumeStream();
    console.log("✅ Stream completed successfully");
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    console.log(`📋 Listing messages for thread: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);

    console.log("🔄 Syncing streams...");
    const streams = await chatAgent.syncStreams(ctx, { threadId, streamArgs });

    console.log("📜 Fetching paginated messages...");
    // Get messages and streams with proper ordering
    const paginated = await chatAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
      excludeToolMessages: true,
    });

    console.log(`✅ Retrieved ${paginated.page.length} messages`);
    return {
      ...paginated,
      streams,
    };
  },
});

export const createThreadWithFirstMessage = mutation({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    console.log("🆕 Creating new thread with first message");
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      console.log("❌ User not found");
      throw new Error("User not found");
    }

    console.log(`👤 User: ${user.tokenIdentifier}`);
    console.log("🧵 Creating thread...");
    const { threadId } = await chatAgent.createThread(ctx, {
      userId: user.tokenIdentifier,
      title: "Generating title...",
    });
    console.log(`✅ Thread created: ${threadId}`);

    console.log("💬 Saving first message...");
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    console.log(`✅ Message saved: ${messageId}`);

    // Schedule both title generation and streaming simultaneously for better UX
    console.log("🎯 Scheduling title generation...");
    void ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
      message: prompt,
      threadId,
    });

    console.log("🚀 Scheduling message streaming...");
    void ctx.scheduler.runAfter(0, internal.chat.streamChat, {
      threadId,
      promptMessageId: messageId,
    });

    console.log("✅ Thread creation completed");
    return { threadId, messageId };
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    console.log("📋 Listing user threads");
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      console.log("❌ User not found");
      throw new Error("User not found");
    }

    console.log(`👤 Fetching threads for user: ${user.tokenIdentifier}`);
    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: user.tokenIdentifier,
        order: "desc",
        paginationOpts: { cursor: null, numItems: 20 },
      },
    );
    console.log(`✅ Retrieved ${result.page.length} threads`);
    return result;
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    console.log(`🗑️ Deleting thread: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);

    console.log("🔄 Deleting all thread data...");
    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });
    console.log("✅ Thread deleted successfully");
  },
});

export const updateThreadTitle = mutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    console.log(`✏️ Updating thread title: ${threadId} -> "${title}"`);
    await authorizeThreadAccess(ctx, threadId);

    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: {
        title: title.trim(),
      },
    });
    console.log("✅ Title updated successfully");
  },
});

export const retryMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, prompt, model }) => {
    console.log(`🔄 Retrying message with model: ${model || "default"}`);
    await authorizeThreadAccess(ctx, threadId);

    // Create a new agent with the specified model if provided
    const modelProvider = model
      ? createModelProvider(model)
      : google("gemini-2.5-flash");
    const retryAgent = model
      ? new Agent(components.agent, {
          chat: modelProvider,
          instructions: PROMPT,
        })
      : chatAgent;

    console.log("💬 Saving retry message...");
    // Save the retry message
    const { messageId: newMessageId } = await retryAgent.saveMessage(ctx, {
      threadId,
      prompt: prompt.trim(),
      skipEmbeddings: true,
    });

    console.log("🚀 Scheduling retry stream...");
    // Schedule the streaming with the specified model
    void ctx.scheduler.runAfter(0, internal.chat.streamChatWithModel, {
      threadId,
      promptMessageId: newMessageId,
      model: model || "gemini-2.5-flash",
    });

    console.log("✅ Retry message setup completed");
    return { messageId: newMessageId };
  },
});

export const streamChatWithModel = internalAction({
  args: {
    promptMessageId: v.string(),
    threadId: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { promptMessageId, threadId, model = "gemini-2.5-flash" },
  ) => {
    console.log(`🤖 Streaming with model: ${model}`);

    // Create agent with specified model
    const modelProvider = createModelProvider(model);
    const modelAgent = new Agent(components.agent, {
      chat: modelProvider,
      instructions: PROMPT,
    });

    console.log("🧵 Continuing thread...");
    const { thread } = await modelAgent.continueThread(ctx, { threadId });

    console.log("🎭 Starting model-specific streaming...");
    const result = await thread.streamText(
      { promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "word",
          throttleMs: 25, // Faster streaming
        },
      },
    );
    console.log("📡 Consuming model stream...");
    await result.consumeStream();
    console.log("✅ Model stream completed");
  },
});

export const getThreadInfo = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    console.log(`ℹ️ Getting thread info: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);
    const info = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    console.log("✅ Thread info retrieved");
    return info;
  },
});
