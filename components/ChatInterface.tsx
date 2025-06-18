"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AVAILABLE_MODELS } from "@/convex/chat";
import { Button } from "./ui/button";
import { MessageSquare, Loader2, Sparkles, Bot, Zap } from "lucide-react";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createThread = useMutation(api.chat.createThreadWithFirstMessage);
  const streamChat = useMutation(api.chat.streamChatAsynchronously);

  const messages = useThreadMessages(
    api.chat.listThreadMessages,
    selectedThreadId
      ? {
          threadId: selectedThreadId,
        }
      : "skip",
    { initialNumItems: 50, stream: true },
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setSelectedThreadId(null);
    setSidebarOpen(false);
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSidebarOpen(false);
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);

    try {
      if (!selectedThreadId) {
        // Create new thread
        const result = await createThread({ prompt: message });
        setSelectedThreadId(result.threadId);
      } else {
        // Send message to existing thread
        await streamChat({ prompt: message, threadId: selectedThreadId });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryMessage = async () => {
    if (messages.results) {
      const lastUserMessage = messages.results
        .filter((msg) => msg.message?.role === "user")
        .pop();

      if (lastUserMessage?.text) {
        await handleSendMessage(lastUserMessage.text);
      }
    }
  };

  const formattedMessages = messages.results
    ? toUIMessages(messages.results)
    : [];

  if (!selectedThreadId) {
    return (
      <div className="flex h-screen">
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedThreadId={selectedThreadId}
          onSelectThread={handleSelectThread}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl floating-animation">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold gradient-text">
                  Welcome to CC Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  Your intelligent AI companion powered by cutting-edge language
                  models
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Multiple AI models available</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Real-time streaming responses</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Advanced markdown support</span>
                </div>
              </div>

              <Button
                onClick={() => setSidebarOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Chatting
              </Button>
            </div>
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {formattedMessages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Start a conversation below
                </p>
              </div>
            </div>
          )}

          {formattedMessages.map((message) => (
            <ChatMessage
              key={message.key}
              message={{
                _id: message.key,
                text: message.content,
                role: message.role as "user" | "assistant",
                model: selectedModel,
                timestamp: message.createdAt ? message.createdAt.getTime() : 0,
              }}
              onRetry={handleRetryMessage}
              selectedModel={selectedModel}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-4 p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  AI is thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
}
