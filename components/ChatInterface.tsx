"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  optimisticallySendMessage,
  toUIMessages,
  useThreadMessages,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { AVAILABLE_MODELS } from "@/convex/chat";
import { Button } from "./ui/button";
import { Menu, X, Edit3, Check, X as XIcon } from "lucide-react";

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentThreadTitle, setCurrentThreadTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");

  const createThread = useMutation(api.chat.createThreadWithFirstMessage);
  const updateThreadTitle = useMutation(api.chat.updateThreadTitle);
  const deleteThread = useMutation(api.chat.deleteThread);
  const retryMessage = useMutation(api.chat.retryMessage);

  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Get thread info to update title in real-time
  const threadInfo = useQuery(
    api.chat.getThreadInfo,
    threadId ? { threadId } : "skip",
  );

  // Update current thread title when thread info changes
  useEffect(() => {
    if (threadInfo?.title && threadInfo.title !== currentThreadTitle) {
      console.log(`🏷️ Updating UI title: ${threadInfo.title}`);
      setCurrentThreadTitle(threadInfo.title);
      setEditTitleValue(threadInfo.title);
    }
  }, [threadInfo?.title, currentThreadTitle]);

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      const newThreadId = getThreadIdFromHash();
      console.log(`🔗 Hash changed to thread: ${newThreadId}`);
      setThreadId(newThreadId);
      setIsEditingTitle(false); // Cancel editing when switching threads
      setCurrentThreadTitle(""); // Clear title when switching
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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
    // Create a new empty thread and navigate to it
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

        // If we deleted the current thread, navigate to new thread
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
        await retryMessage({
          threadId,
          prompt,
          model: model || selectedModel,
        });
      } catch (error) {
        console.error("Failed to retry message:", error);
      }
    },
    [retryMessage, selectedModel],
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Chat History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ChatSidebar
              onSelectThread={handleThreadSelect}
              onNewChat={handleNewChat}
              onDeleteThread={handleDeleteThread}
              selectedThreadId={threadId || null}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
        </div>
        <ChatSidebar
          onSelectThread={handleThreadSelect}
          onNewChat={handleNewChat}
          onDeleteThread={handleDeleteThread}
          selectedThreadId={threadId || null}
        />
      </div>

      {/* Main Content - Full Height Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white border-b shrink-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Thread title */}
          <div className="flex-1 flex items-center justify-center lg:justify-start lg:ml-0 ml-12">
            {threadId ? (
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      className="px-2 py-1 border rounded text-sm font-medium max-w-48 text-gray-900 bg-white"
                      placeholder="Enter title..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveTitle}
                      className="w-6 h-6 p-0"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="w-6 h-6 p-0"
                    >
                      <XIcon className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-gray-900 truncate max-w-48">
                      {currentThreadTitle || "New Chat"}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEditingTitle}
                      className="w-6 h-6 p-0"
                    >
                      <Edit3 className="w-3 h-3 text-gray-500" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-gray-900">New Chat</h1>
            )}
          </div>
        </header>

        {/* Chat Content - Takes remaining height */}
        <main className="flex-1 flex flex-col min-h-0 p-4">
          {threadId ? (
            <Chat
              threadId={threadId}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onRetryMessage={handleRetryMessage}
            />
          ) : (
            <EmptyState
              onStartChat={(message: string) => {
                console.log("🚀 Starting new chat with message");
                createThread({ prompt: message }).then((result) => {
                  console.log(`✅ Thread created: ${result.threadId}`);
                  window.location.hash = result.threadId;
                  setThreadId(result.threadId);
                });
              }}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({
  onStartChat,
  selectedModel,
  onModelChange,
}: {
  onStartChat: (message: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Start a New Conversation
          </h3>
          <p className="text-gray-700 mb-6">
            Ask me anything to begin chatting. I can help with questions,
            coding, writing, and more.
          </p>
        </div>
      </div>

      <div className="border-t p-4 shrink-0">
        <ChatInput
          onSendMessage={onStartChat}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          placeholder="Type your first message to start..."
        />
      </div>
    </div>
  );
}

function Chat({
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
  const messages = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 50, stream: true },
  );
  const sendMessage = useMutation(
    api.chat.streamChatAsynchronously,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.listThreadMessages),
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      console.log(`💬 Sending message: ${message.slice(0, 50)}...`);
      await sendMessage({ threadId, prompt: message.trim() });
    },
    [sendMessage, threadId],
  );

  const handleRetryMessage = useCallback(
    async (messageKey: string, model?: string) => {
      console.log(
        `🔄 Retrying message: ${messageKey} with model: ${model || selectedModel}`,
      );
      // Get the UI messages to find the user message for retry
      const uiMessages = toUIMessages(messages.results ?? []);
      let userMessageContent = "";

      // Find the user message that corresponds to the assistant message being retried
      for (let i = 0; i < uiMessages.length; i++) {
        if (uiMessages[i].key === messageKey) {
          // Look backwards for the previous user message
          for (let j = i - 1; j >= 0; j--) {
            if (uiMessages[j].role === "user") {
              userMessageContent = uiMessages[j].content;
              break;
            }
          }
          break;
        }
      }

      if (!userMessageContent) {
        console.error("Could not find user message to retry");
        return;
      }

      onRetryMessage(threadId, userMessageContent, model || selectedModel);
    },
    [messages.results, onRetryMessage, threadId, selectedModel],
  );

  const uiMessages = toUIMessages(messages.results ?? []);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Messages - Takes remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {uiMessages.length > 0 ? (
          <div className="flex flex-col">
            {uiMessages.map((message) => (
              <ChatMessage
                key={message.key}
                message={message}
                onRetry={handleRetryMessage}
                selectedModel={selectedModel}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-gray-900">
                Continue the conversation
              </h3>
              <p className="text-sm text-gray-700">
                Send a message to get started!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input - Fixed at bottom */}
      <div className="border-t p-4 shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
}
