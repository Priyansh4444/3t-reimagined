"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { RotateCcw, User, Bot, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { AVAILABLE_MODELS } from "@/convex/chat";

interface UIMessage {
  key: string;
  role: "user" | "assistant" | "data" | "system";
  content: string;
  _id?: string;
}

interface ChatMessageProps {
  message: UIMessage;
  onRetry?: (messageId: string, model?: string) => void;
  selectedModel?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  onRetry,
  selectedModel,
  isStreaming = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showRetryOptions, setShowRetryOptions] = useState(false);

  const isUser = message.role === "user";
  const messageContent = message.content || "";

  // For streaming messages, show typing indicator
  const showTypingIndicator =
    isStreaming && !isUser && messageContent.length > 0;
  const isEmptyStream = isStreaming && !isUser && messageContent.length === 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleRetry = (model?: string) => {
    if (onRetry && message.key) {
      onRetry(message.key, model);
      setShowRetryOptions(false);
    }
  };

  // Don't render data or system messages
  if (message.role === "data" || message.role === "system") {
    return null;
  }

  return (
    <div className="group relative px-4 py-6 hover:bg-gray-50/50 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm relative">
                <Bot className="w-4 h-4 text-white" />
                {showTypingIndicator && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {isUser ? "You" : "Assistant"}
                </span>
                {showTypingIndicator && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-600">typing...</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="w-7 h-7 p-0 hover:bg-gray-200 transition-colors"
                      title="Copy message"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-600" />
                      )}
                    </Button>

                    {onRetry && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRetryOptions(!showRetryOptions)}
                          className="w-7 h-7 p-0 hover:bg-gray-200 transition-colors"
                          title="Retry with different model"
                        >
                          <RotateCcw className="w-3 h-3 text-gray-600" />
                        </Button>

                        {showRetryOptions && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-700 mb-2 px-2">
                                Retry with model:
                              </div>
                              <button
                                onClick={() => handleRetry(selectedModel)}
                                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-800"
                              >
                                Same model (
                                {
                                  AVAILABLE_MODELS.find(
                                    (m) => m.id === selectedModel,
                                  )?.name
                                }
                                )
                              </button>
                              {AVAILABLE_MODELS.filter(
                                (m) => m.id !== selectedModel,
                              ).map((model) => (
                                <button
                                  key={model.id}
                                  onClick={() => handleRetry(model.id)}
                                  className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-800"
                                >
                                  {model.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="prose prose-sm max-w-none prose-gray">
              {isEmptyStream ? (
                <div className="flex items-center gap-1 text-gray-600 py-2">
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    // Code blocks
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isCodeBlock = !!match;

                      if (isCodeBlock) {
                        return (
                          <div className="relative group">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 border border-gray-700">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigator.clipboard.writeText(String(children))
                              }
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 p-0 bg-gray-800 hover:bg-gray-700 text-gray-300"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-900 border"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },

                    // Paragraphs
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0 leading-relaxed text-gray-900">
                        {children}
                      </p>
                    ),

                    // Lists
                    ul: ({ children }) => (
                      <ul className="mb-4 space-y-1 list-disc list-inside text-gray-900">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 space-y-1 list-decimal list-inside text-gray-900">
                        {children}
                      </ol>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-800 bg-blue-50 py-2 rounded-r">
                        {children}
                      </blockquote>
                    ),

                    // Headers
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mb-3 text-gray-900 border-b pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mb-2 text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mb-2 text-gray-900">
                        {children}
                      </h3>
                    ),

                    // Tables
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left text-gray-900">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-3 py-2 text-gray-900">
                        {children}
                      </td>
                    ),

                    // Links
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        className="text-blue-600 underline hover:text-blue-800 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {messageContent}
                </ReactMarkdown>
              )}

              {showTypingIndicator && (
                <span className="inline-block w-0.5 h-4 bg-gray-400 opacity-75 animate-pulse ml-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
