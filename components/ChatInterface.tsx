"use client";

import React, {
  memo,
  useMemo,
  useCallback,
  useEffect,
  useState,
  Suspense,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  optimisticallySendMessage,
  toUIMessages,
  useThreadMessages,
} from "@convex-dev/agent/react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { AVAILABLE_MODELS } from "@/convex/chat";
import { Button } from "./ui/button";
import {
  Menu,
  X,
  Edit3,
  Check,
  X as XIcon,
  Sparkles,
  Bot,
  MessageSquare,
  Loader2,
} from "lucide-react";

// Optimized helper function - moved outside component to prevent recreations
function getThreadIdFromHash() {
  if (typeof window === "undefined") return undefined;
  return window.location.hash.replace(/^#/, "") || undefined;
}

// Streaming loading indicator component
const StreamingLoader = memo(function StreamingLoader() {
  return (
    <div className="flex items-center justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            AI is thinking...
          </span>
        </div>
      </div>
    </div>
  );
});

// Memoized EmptyState component for better performance
const EmptyState = memo(function EmptyState({
  onStartChat,
  selectedModel,
  onModelChange,
}: {
  onStartChat: (message: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}) {
  const selectedModelInfo = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === selectedModel),
    [selectedModel],
  );

  return (
    <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-float">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to CC Chat
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Start a conversation with AI using{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {selectedModelInfo?.name}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Natural Conversations
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Engage in natural, flowing conversations with advanced AI models
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
            <Sparkles className="w-8 h-8 text-purple-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Multiple Models
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Choose from various AI models to find the perfect fit for your
              needs
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
            <Bot className="w-8 h-8 text-green-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Smart & Fast
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Get intelligent responses quickly with optimized performance
            </p>
          </div>
        </div>

        <ChatInput
          onSendMessage={onStartChat}
          disabled={false}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          placeholder="Ask me anything to get started..."
        />
      </div>
    </div>
  );
});

// Memoized Chat component for better performance
const Chat = memo(function Chat({
  threadId,
  selectedModel,
  onModelChange,
  onRetryMessage,
}: {
  threadId: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onRetryMessage: (threadId: string, prompt: string, model?: string) => void;
}) {
  // State to track retrying message pairs (user + assistant)
  const [retryingMessagePair, setRetryingMessagePair] = useState<{
    userMessageId: string;
    assistantMessageId: string;
    userPrompt: string;
  } | null>(null);

  // Memoize the query args to prevent unnecessary re-calls
  const queryArgs = useMemo(() => ({ threadId }), [threadId]);
  const queryOptions = useMemo(
    () => ({
      initialNumItems: 50,
      stream: true,
    }),
    [],
  );

  const messages = useThreadMessages(
    api.chat.listThreadMessages,
    queryArgs,
    queryOptions,
  );

  // Memoize the optimistic update function to prevent recreations
  const optimisticUpdate = useMemo(
    () => optimisticallySendMessage(api.chat.listThreadMessages),
    [],
  );

  const sendMessage = useMutation(
    api.chat.streamChatAsynchronously,
  ).withOptimisticUpdate(optimisticUpdate);

  const handleSendMessage = useCallback(
    async (message: string) => {
      console.log("📤 Sending optimistic message");
      await sendMessage({ prompt: message, threadId });
    },
    [sendMessage, threadId],
  );

  const handleRetry = useCallback(
    async (assistantMessageId: string, selectedModel?: string) => {
      console.log("🔄 Starting retry for message:", assistantMessageId);
      console.log("🔄 Selected model:", selectedModel);

      // Find the assistant message and corresponding user message
      const allMessages = toUIMessages(messages.results ?? []);
      console.log("🔄 Total messages:", allMessages.length);

      const assistantMessage = allMessages.find(
        (msg) => msg.key === assistantMessageId,
      );
      if (!assistantMessage) {
        console.error("❌ Assistant message not found:", assistantMessageId);
        return;
      }

      console.log(
        "🔄 Found assistant message:",
        assistantMessage.content.slice(0, 50),
      );

      // Find the user message that comes before this assistant message
      const assistantIndex = allMessages.findIndex(
        (msg) => msg.key === assistantMessageId,
      );
      const userMessage =
        assistantIndex > 0 ? allMessages[assistantIndex - 1] : null;

      if (!userMessage || userMessage.role !== "user") {
        console.error("❌ Could not find corresponding user message");
        return;
      }

      console.log("🔄 Found user message:", userMessage.content.slice(0, 50));
      console.log("🔄 User message ID:", userMessage.key);

      // Set retrying state to hide both messages
      const retryPair = {
        userMessageId: userMessage.key,
        assistantMessageId: assistantMessageId,
        userPrompt: userMessage.content,
      };

      console.log("🔄 Setting retry pair state:", retryPair);
      setRetryingMessagePair(retryPair);

      try {
        console.log("🔄 Calling onRetryMessage...");
        const result = await onRetryMessage(
          threadId,
          userMessage.content,
          selectedModel,
        );
        console.log("🔄 onRetryMessage result:", result);
      } catch (error) {
        console.error("❌ Retry failed:", error);
        // Clear retrying state on error
        setRetryingMessagePair(null);
      }
    },
    [messages.results, onRetryMessage, threadId],
  );

  // Filter messages to hide retrying pair and show replacement
  const uiMessages = useMemo(() => {
    const results = messages.results ?? [];
    const allMessages = toUIMessages(results);

    if (!retryingMessagePair) {
      return allMessages;
    }

    // Filter out the retrying message pair
    return allMessages.filter(
      (msg) =>
        msg.key !== retryingMessagePair.userMessageId &&
        msg.key !== retryingMessagePair.assistantMessageId,
    );
  }, [messages.results, retryingMessagePair]);

  // More precise streaming detection
  const isStreaming = useMemo(() => {
    return messages.status === "LoadingMore" || messages.isLoading;
  }, [messages.status, messages.isLoading]);

  // Clear retrying state when new messages arrive (indicating retry is complete)
  useEffect(() => {
    if (retryingMessagePair && messages.results) {
      console.log("🔍 Retry in progress, monitoring for completion...");

      // Set a timeout to clear retry state - this ensures it always clears
      const timeoutId = setTimeout(() => {
        console.log("🔄 Clearing retry state due to timeout (5s)");
        setRetryingMessagePair(null);
      }, 5000);

      // Also check if we got new messages
      const allMessages = toUIMessages(messages.results);
      const hasNewMessages = allMessages.length > 0;

      if (hasNewMessages && !isStreaming) {
        // Clear immediately if we're not streaming and have messages
        const quickTimeoutId = setTimeout(() => {
          console.log("✅ Retry likely complete, clearing state");
          setRetryingMessagePair(null);
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(quickTimeoutId);
        };
      }

      return () => clearTimeout(timeoutId);
    }
  }, [messages.results, retryingMessagePair, isStreaming]);

  // Optimize streaming message ID calculation
  const streamingMessageId = useMemo(() => {
    if (!isStreaming || uiMessages.length === 0) return undefined;
    const lastMessage = uiMessages[uiMessages.length - 1];
    return lastMessage?.role === "assistant" ? lastMessage.key : undefined;
  }, [isStreaming, uiMessages]);

  // Show retry indicator when retrying
  const showRetryIndicator = useMemo(() => {
    return retryingMessagePair !== null && !isStreaming;
  }, [retryingMessagePair, isStreaming]);

  if (messages.status === "LoadingFirstPage") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {uiMessages.map((message, index) => (
            <div
              key={message.key}
              className={`animate-fade-in-up ${
                message.role === "user"
                  ? "animate-slide-in-right"
                  : "animate-slide-in-left"
              }`}
              style={{
                animationDelay: `${Math.min(index * 50, 500)}ms`,
              }}
            >
              <ChatMessage
                message={message}
                onRetry={handleRetry}
                selectedModel={selectedModel}
                isStreaming={message.key === streamingMessageId}
              />
            </div>
          ))}

          {/* Show retry indicator */}
          {showRetryIndicator && (
            <div className="flex items-center justify-center py-4 animate-fade-in">
              <div className="flex items-center gap-3 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  Retrying with new model...
                </span>
              </div>
            </div>
          )}

          {/* Show streaming loader when AI is generating response */}
          {isStreaming && <StreamingLoader />}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isStreaming || showRetryIndicator}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          placeholder={
            showRetryIndicator
              ? "Retrying message..."
              : isStreaming
                ? "AI is responding..."
                : "Type your message..."
          }
        />
      </div>
    </div>
  );
});

// Memoized Title Editor for better performance
const TitleEditor = memo(function TitleEditor({
  title,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  value,
  onChange,
}: {
  title: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-lg font-semibold bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="w-12 h-12 p-2 hover:bg-green-100 dark:hover:bg-green-900/20"
        >
          <Check className="w-6 h-6 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="w-12 h-12 p-2 hover:bg-red-100 dark:hover:bg-red-900/20"
        >
          <XIcon className="w-6 h-6 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className="flex items-center gap-2 flex-1 group hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition-colors"
    >
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
        {title || "New Chat"}
      </h1>
      <Edit3 className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
});

export const ChatInterface = memo(function ChatInterface() {
  // State management with optimized initial values
  const [selectedModel, setSelectedModel] = useState(
    () => AVAILABLE_MODELS[0].id,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentThreadTitle, setCurrentThreadTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(() =>
    getThreadIdFromHash(),
  );

  // Memoized API calls
  const createThread = useMutation(api.chat.createThreadWithFirstMessage);
  const updateThreadTitle = useMutation(api.chat.updateThreadTitle);
  const deleteThread = useMutation(api.chat.deleteThread);
  const retryMessage = useMutation(api.chat.retryMessage);

  // Optimized thread info query
  const threadInfo = useQuery(
    api.chat.getThreadInfo,
    threadId ? { threadId } : "skip",
  );

  // Memoized callbacks for better performance
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  const handleThreadSelect = useCallback((newThreadId: string) => {
    console.log(`🎯 Selecting thread: ${newThreadId}`);
    window.location.hash = newThreadId;
    setThreadId(newThreadId);
    setSidebarOpen(false);
    setIsEditingTitle(false);
  }, []);

  const handleNewChat = useCallback(() => {
    console.log("🆕 Starting new chat");
    setThreadId(undefined);
    window.location.hash = "";
    setSidebarOpen(false);
    setIsEditingTitle(false);
    setCurrentThreadTitle("");
  }, []);

  const handleDeleteThread = useCallback(
    async (threadIdToDelete: string) => {
      try {
        console.log(`🗑️ Deleting thread: ${threadIdToDelete}`);
        await deleteThread({ threadId: threadIdToDelete });

        if (threadIdToDelete === threadId) {
          handleNewChat();
        }
      } catch (error) {
        console.error("Failed to delete thread:", error);
      }
    },
    [deleteThread, threadId, handleNewChat],
  );

  const handleSaveTitle = useCallback(async () => {
    if (!threadId || !editTitleValue.trim()) return;

    try {
      console.log(`✏️ Saving new title: ${editTitleValue.trim()}`);
      await updateThreadTitle({
        threadId,
        title: editTitleValue.trim(),
      });
      setCurrentThreadTitle(editTitleValue.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  }, [threadId, editTitleValue, updateThreadTitle]);

  const handleCancelEdit = useCallback(() => {
    setEditTitleValue(currentThreadTitle);
    setIsEditingTitle(false);
  }, [currentThreadTitle]);

  const startEditingTitle = useCallback(() => {
    setEditTitleValue(currentThreadTitle);
    setIsEditingTitle(true);
  }, [currentThreadTitle]);

  const handleRetryMessage = useCallback(
    async (threadId: string, prompt: string, model?: string) => {
      try {
        console.log(
          `🔄 Retrying message with model: ${model || selectedModel}`,
        );

        // Call the retry mutation
        await retryMessage({
          threadId,
          prompt,
          model: model || selectedModel,
        });

        console.log("✅ Retry message initiated");
      } catch (error) {
        console.error("Failed to retry message:", error);
      }
    },
    [retryMessage, selectedModel],
  );

  const handleStartChat = useCallback(
    async (message: string) => {
      try {
        console.log("🚀 Starting new chat with message");

        const result = await createThread({
          prompt: message,
          model: selectedModel,
        });
        console.log(`✅ Thread created: ${result.threadId}`);

        window.location.hash = result.threadId;
        setThreadId(result.threadId);
        setCurrentThreadTitle("New Chat");
        console.log("🏷️ Initial title set, AI generation scheduled");
      } catch (error) {
        console.error("Failed to create thread:", error);
      }
    },
    [createThread, selectedModel],
  );

  // Optimized effect for thread title updates
  useEffect(() => {
    if (threadInfo?.title && threadInfo.title !== currentThreadTitle) {
      console.log(`🏷️ Updating UI title: ${threadInfo.title}`);
      setCurrentThreadTitle(threadInfo.title);
      setEditTitleValue(threadInfo.title);
    }
  }, [threadInfo?.title, currentThreadTitle]);

  // Optimized effect for hash changes
  useEffect(() => {
    function onHashChange() {
      const newThreadId = getThreadIdFromHash();
      console.log(`🔗 Hash changed to thread: ${newThreadId}`);
      setThreadId(newThreadId);
      setIsEditingTitle(false);
      setCurrentThreadTitle("");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 dark:border-slate-700 animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Chat History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Suspense fallback={<div className="p-4">Loading...</div>}>
              <ChatSidebar
                onSelectThread={handleThreadSelect}
                onNewChat={handleNewChat}
                onDeleteThread={handleDeleteThread}
                selectedThreadId={threadId || null}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Chat History
          </h2>
        </div>
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          <ChatSidebar
            onSelectThread={handleThreadSelect}
            onNewChat={handleNewChat}
            onDeleteThread={handleDeleteThread}
            selectedThreadId={threadId || null}
          />
        </Suspense>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {threadId ? (
              <TitleEditor
                title={currentThreadTitle}
                isEditing={isEditingTitle}
                onStartEdit={startEditingTitle}
                onSave={handleSaveTitle}
                onCancel={handleCancelEdit}
                value={editTitleValue}
                onChange={setEditTitleValue}
              />
            ) : (
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                New Chat
              </h1>
            )}
          </div>

          <Button
            onClick={handleNewChat}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <span className="flex items-center gap-2">
              New Chat
              <Sparkles className="w-4 h-4" />
            </span>
          </Button>
        </div>

        {/* Chat Area */}
        {threadId ? (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            }
          >
            <Chat
              threadId={threadId}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onRetryMessage={handleRetryMessage}
            />
          </Suspense>
        ) : (
          <EmptyState
            onStartChat={handleStartChat}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
        )}
      </div>
    </div>
  );
});
