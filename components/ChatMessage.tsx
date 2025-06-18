"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { RotateCcw, User, Bot, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ChatMessageProps {
  message: {
    _id: string;
    text: string;
    role: "user" | "assistant";
    model?: string;
    timestamp: number;
  };
  onRetry?: (messageId: string, model?: string) => void;
  selectedModel?: string;
}

export function ChatMessage({
  message,
  onRetry,
  selectedModel,
}: ChatMessageProps) {
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const modelName = message.model || "Unknown Model";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-4 p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg relative">
            <Bot className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isUser ? "You" : "Assistant"}
            </span>
            {!isUser && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">AI</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && showModelInfo && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full text-xs">
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-medium">
                  {modelName}
                </span>
              </div>
            )}

            {!isUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            )}

            {!isUser && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(message._id, selectedModel)}
                className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Retry with different model"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
              </Button>
            )}
          </div>
        </div>

        <div
          className={`message-bubble group ${
            isUser ? "user-message" : "assistant-message"
          }`}
          onMouseEnter={() => setShowModelInfo(true)}
          onMouseLeave={() => setShowModelInfo(false)}
        >
          <div
            className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isCodeBlock = !!match;
                  return isCodeBlock ? (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 border border-gray-700">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className={`px-2 py-1 rounded text-sm font-mono ${
                        isUser
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 space-y-1 list-disc list-inside">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 space-y-1 list-decimal list-inside">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-current pl-4 italic my-4 opacity-80">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
