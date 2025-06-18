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

// Improved title generation that runs automatically after thread creation
export const generateTitleInternal = internalAction({
  args: {
    threadId: v.string(),
    firstMessage: v.string(),
    model: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, firstMessage, model }) => {
    console.log(
      `🤖 [TITLE GEN] Starting title generation for thread: ${threadId}`,
    );
    console.log(
      `🤖 [TITLE GEN] First message: ${firstMessage.slice(0, 100)}...`,
    );
    console.log(`🤖 [TITLE GEN] Using model: ${model}`);

    const systemPrompt =
      "You are a helpful assistant that creates short, descriptive titles for conversations. Generate a concise title (3-6 words) based on the user's message. Return only the title without quotes, explanations, or extra text.";
    const prompt = `User message: "${firstMessage}"\n\nCreate a short descriptive title for this conversation:`;

    try {
      console.log(`🔄 [TITLE GEN] Calling AI with model: ${model}`);
      const modelProvider = createModelProvider(model);

      const {text: generatedTitle} = await generateText({
        model: modelProvider,
        system: systemPrompt,
        prompt,
        temperature: 0.7,
      });

      console.log(`✨ [TITLE GEN] Generated title: "${generatedTitle}"`);

      // Check if we got a valid title, fallback if empty or too generic
      const finalTitle =
        generatedTitle &&
        generatedTitle.length > 0 &&
        generatedTitle !== "New Chat" &&
        generatedTitle !== "Chat" &&
        generatedTitle !== "Conversation"
          ? generatedTitle
          : firstMessage.length > 30
            ? firstMessage.slice(0, 27) + "..."
            : firstMessage;

      console.log(`🏷️ [TITLE GEN] Final title: "${finalTitle}"`);

      // Update the thread title directly using components
      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId,
        patch: {
          title: finalTitle,
        },
      });

      console.log("✅ [TITLE GEN] Title updated successfully in database");
    } catch (error) {
      console.error("❌ [TITLE GEN] Title generation failed:", error);
      console.error(
        "❌ [TITLE GEN] Error details:",
        JSON.stringify(error, null, 2),
      );

      // Update with fallback title
      try {
        await ctx.runMutation(components.agent.threads.updateThread, {
          threadId,
          patch: {
            title: "New Chat",
          },
        });
        console.log("✅ [TITLE GEN] Fallback title set");
      } catch (fallbackError) {
        console.error("❌ [TITLE GEN] Even fallback failed:", fallbackError);
      }
    }

    return null;
  },
});

const chatAgent = new Agent(components.agent, {
  // Use Google AI SDK directly with Gemini 2.5 Flash for better performance and streaming
  chat: google("gemini-2.5-flash"),
  instructions: PROMPT,
});

export const streamChatAsynchronously = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  returns: v.object({ messageId: v.string() }),
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
  returns: v.null(),
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
    return null;
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    streams: v.optional(v.any()),
  }),
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
  args: { prompt: v.string(), model: v.optional(v.string()) },
  returns: v.object({ threadId: v.string(), messageId: v.string() }),
  handler: async (ctx, { prompt, model = "gemini-2.5-flash" }) => {
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
      title: "New Chat", // Will be updated by AI
    });
    console.log(`✅ Thread created: ${threadId}`);

    console.log("💬 Saving first message...");
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    console.log(`✅ Message saved: ${messageId}`);

    console.log("🚀 Scheduling message streaming...");
    void ctx.scheduler.runAfter(0, internal.chat.streamChat, {
      threadId,
      promptMessageId: messageId,
    });

    console.log("🏷️ Scheduling title generation...");
    console.log(
      `🏷️ Title generation args: threadId=${threadId}, firstMessage="${prompt.slice(0, 50)}...", model=${model}`,
    );

    try {
      await ctx.scheduler.runAfter(0, internal.chat.generateTitleInternal, {
        threadId,
        firstMessage: prompt,
        model,
      });
      console.log("✅ Title generation scheduled successfully");
      console.log(
        "New title:",
        await ctx.runQuery(components.agent.threads.getThread, {
          threadId,
        }),
      );
    } catch (scheduleError) {
      console.error("❌ Failed to schedule title generation:", scheduleError);

      // If scheduling fails, set fallback title immediately
      const fallbackTitle =
        prompt.length > 30 ? prompt.slice(0, 27) + "..." : prompt;
      try {
        await ctx.runMutation(components.agent.threads.updateThread, {
          threadId,
          patch: {
            title: fallbackTitle,
          },
        });
        console.log(`✅ Emergency fallback title set: "${fallbackTitle}"`);
      } catch (fallbackError) {
        console.error("❌ Emergency fallback failed:", fallbackError);
      }
    }

    console.log("✅ Thread creation completed");
    return { threadId, messageId };
  },
});

export const listThreads = query({
  args: {},
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
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
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    console.log(`🗑️ Deleting thread: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);

    console.log("🔄 Deleting all thread data...");
    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });
    console.log("✅ Thread deleted successfully");
    return null;
  },
});

export const updateThreadTitle = mutation({
  args: { threadId: v.string(), title: v.string() },
  returns: v.null(),
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
    return null;
  },
});

export const retryMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  returns: v.object({ messageId: v.string() }),
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
  returns: v.null(),
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
    return null;
  },
});

export const getThreadInfo = query({
  args: { threadId: v.string() },
  returns: v.union(v.any(), v.null()),
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

// Debug mutation to manually test title generation
export const debugGenerateTitle = mutation({
  args: {
    threadId: v.string(),
    firstMessage: v.string(),
    model: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { threadId, firstMessage, model = "gemini-2.5-flash" },
  ) => {
    console.log(`🐛 Debug: Manual title generation for thread: ${threadId}`);
    await authorizeThreadAccess(ctx, threadId);

    console.log("🐛 Debug: Scheduling title generation immediately...");
    await ctx.scheduler.runAfter(0, internal.chat.generateTitleInternal, {
      threadId,
      firstMessage,
      model,
    });

    console.log("🐛 Debug: Title generation scheduled");
    return null;
  },
});
