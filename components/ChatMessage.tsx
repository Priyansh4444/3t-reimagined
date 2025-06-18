"use client";

import { useState, memo, useMemo, useCallback } from "react";
import { Button } from "./ui/button";
import { RotateCcw, User, Bot, Copy, Check, Sparkles } from "lucide-react";
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

// Memoized typing indicator component
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 py-2">
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
  );
});

// Memoized streaming indicator
const StreamingIndicator = memo(function StreamingIndicator() {
  return (
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
    </div>
  );
});

// Memoized retry dropdown component
const RetryDropdown = memo(function RetryDropdown({
  isOpen,
  onClose,
  onRetry,
  selectedModel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRetry: (model?: string) => void;
  selectedModel?: string;
}) {
  const handleRetryWithModel = useCallback(
    (model?: string) => {
      onRetry(model);
      onClose();
    },
    [onRetry, onClose],
  );

  const otherModels = useMemo(
    () => AVAILABLE_MODELS.filter((m) => m.id !== selectedModel),
    [selectedModel],
  );

  const currentModel = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === selectedModel),
    [selectedModel],
  );

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 min-w-64 animate-fade-in-up backdrop-blur-xl">
      <div className="p-3">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 px-2">
          Retry with model:
        </div>

        {/* Current model option */}
        <button
          onClick={() => handleRetryWithModel(selectedModel)}
          className="w-full text-left px-3 py-3 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-800 dark:text-slate-200 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{currentModel?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Current model
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentModel?.free ? (
                <Sparkles className="w-3 h-3 text-teal-500" />
              ) : (
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
              )}
            </div>
          </div>
        </button>

        {/* Divider */}
        {otherModels.length > 0 && (
          <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
        )}

        {/* Other models */}
        {otherModels.map((model) => (
          <button
            key={model.id}
            onClick={() => handleRetryWithModel(model.id)}
            className="w-full text-left px-3 py-3 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-800 dark:text-slate-200 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {model.provider} {model.free && "• Free"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {model.free ? (
                  <Sparkles className="w-3 h-3 text-teal-500" />
                ) : (
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// Memoized code block component for better performance
const CodeBlock = memo(function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(children));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [children]);

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 text-slate-300 px-4 py-2 rounded-t-lg border-b border-slate-700">
        <span className="text-sm font-medium capitalize">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200 hover:bg-slate-700 h-12 w-12 p-2"
        >
          {copied ? (
            <Check className="w-6 h-6 text-green-400" />
          ) : (
            <Copy className="w-6 h-6" />
          )}
        </Button>
      </div>
      <pre className="bg-slate-900 dark:bg-black text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
});

export const ChatMessage = memo(function ChatMessage({
  message,
  onRetry,
  selectedModel,
  isStreaming = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showRetryOptions, setShowRetryOptions] = useState(false);

  const isUser = message.role === "user";
  const messageContent = message.content || "";

  // Memoized computed values
  const showTypingIndicator = useMemo(
    () => isStreaming && !isUser && messageContent.length > 0,
    [isStreaming, isUser, messageContent.length],
  );

  const isEmptyStream = useMemo(
    () => isStreaming && !isUser && messageContent.length === 0,
    [isStreaming, isUser, messageContent.length],
  );

  // Memoized callbacks
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [messageContent]);

  const handleRetry = useCallback(
    (model?: string) => {
      if (onRetry && message.key) {
        onRetry(message.key, model);
      }
    },
    [onRetry, message.key],
  );

  const toggleRetryOptions = useCallback(() => {
    setShowRetryOptions((prev) => !prev);
  }, []);

  const closeRetryOptions = useCallback(() => {
    setShowRetryOptions(false);
  }, []);

  // Memoized markdown components for better performance
  const markdownComponents = useMemo(
    () => ({
      code: (
        props: React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
          className?: string;
        },
      ) => {
        const { className, children, ...restProps } = props;
        const match = /language-(\w+)/.exec(className || "");
        const isCodeBlock = !!match;

        if (isCodeBlock) {
          return <CodeBlock className={className}>{children}</CodeBlock>;
        }

        return (
          <code
            className={`${className || ""} bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono`}
            {...restProps}
          >
            {children}
          </code>
        );
      },
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 my-4 italic text-slate-600 dark:text-slate-400">
          {children}
        </blockquote>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-bold mb-2 mt-5 first:mt-0">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>
      ),
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
        >
          {children}
        </a>
      ),
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-slate-300 dark:border-slate-600 rounded-lg">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
      ),
      tbody: ({ children }: { children?: React.ReactNode }) => (
        <tbody>{children}</tbody>
      ),
      tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="border-b border-slate-200 dark:border-slate-700">
          {children}
        </tr>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-4 py-2 text-left font-semibold text-slate-900 dark:text-slate-100">
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
          {children}
        </td>
      ),
    }),
    [],
  );

  // Don't render data or system messages
  if (message.role === "data" || message.role === "system") {
    return null;
  }

  return (
    <div className="group relative px-4 py-6 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all duration-300 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-800">
                <User className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="relative w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-800">
                <Bot className="w-5 h-5 text-white" />
                {showTypingIndicator && <StreamingIndicator />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isUser ? "You" : "Assistant"}
                </span>
                {showTypingIndicator && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                    <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                      typing...
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {!isUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="w-12 h-12 p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-lg"
                      title="Copy message"
                    >
                      {copied ? (
                        <Check className="w-6 h-6 text-teal-600" />
                      ) : (
                        <Copy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      )}
                    </Button>

                    {onRetry && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleRetryOptions}
                          className="w-12 h-12 p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-lg"
                          title="Retry with different model"
                        >
                          <RotateCcw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </Button>

                        <RetryDropdown
                          isOpen={showRetryOptions}
                          onClose={closeRetryOptions}
                          onRetry={handleRetry}
                          selectedModel={selectedModel}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="prose prose-sm max-w-none prose-slate dark:prose-invert">
              {isEmptyStream ? (
                <TypingIndicator />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {messageContent}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handler for retry dropdown */}
      {showRetryOptions && (
        <div
          className="fixed inset-0 z-0"
          onClick={closeRetryOptions}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeRetryOptions();
            }
          }}
        />
      )}
    </div>
  );
});
