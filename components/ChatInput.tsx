"use client";

import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { Button } from "./ui/button";
import { Send, ChevronDown, Star, Zap, Loader2 } from "lucide-react";
import { AVAILABLE_MODELS } from "@/convex/chat";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  placeholder?: string;
}

// Memoized model option component
const ModelOption = memo(function ModelOption({
  model,
  isSelected,
  onClick,
}: {
  model: (typeof AVAILABLE_MODELS)[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
        isSelected
          ? model.free
            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
            : "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
          : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{model.name}</div>
          <div className="text-xs opacity-70">{model.provider}</div>
        </div>
        <div className="flex items-center gap-1">
          {model.free ? (
            <>
              <Star className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                FREE
              </span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                PREMIUM
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

export const ChatInput = memo(function ChatInput({
  onSendMessage,
  disabled = false,
  selectedModel,
  onModelChange,
  placeholder = "Type your message... (Shift + Enter for new line)",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  // Memoized model info
  const selectedModelInfo = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === selectedModel),
    [selectedModel],
  );

  // Memoized grouped models
  const { freeModels, premiumModels } = useMemo(() => {
    const free = AVAILABLE_MODELS.filter((m) => m.free);
    const premium = AVAILABLE_MODELS.filter((m) => !m.free);
    return { freeModels: free, premiumModels: premium };
  }, []);

  // Memoized callbacks
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !disabled) {
        console.log("📤 Submitting message from ChatInput");
        onSendMessage(message.trim());
        setMessage("");
      }
    },
    [message, disabled, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const handleModelSelect = useCallback(
    (modelId: string) => {
      console.log(`🤖 Selecting model: ${modelId}`);
      onModelChange(modelId);
      setShowModelSelect(false);
    },
    [onModelChange],
  );

  const toggleModelSelect = useCallback(() => {
    setShowModelSelect((prev) => !prev);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [message]);

  // Close model selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelSelectRef.current &&
        !modelSelectRef.current.contains(event.target as Node)
      ) {
        setShowModelSelect(false);
      }
    }

    if (showModelSelect) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelSelect]);

  return (
    <div className="space-y-4">
      {/* Model Selector */}
      <div className="relative" ref={modelSelectRef}>
        <button
          type="button"
          onClick={toggleModelSelect}
          disabled={disabled}
          className={`flex items-center gap-3 px-4 py-3 text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 w-full shadow-sm ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            {selectedModelInfo?.free ? (
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div className="flex-1 text-left">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {selectedModelInfo?.name || "Unknown Model"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedModelInfo?.provider}
                {selectedModelInfo?.free && " • Free"}
              </div>
            </div>
            {selectedModelInfo?.free && (
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                FREE
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
              showModelSelect ? "rotate-180" : ""
            }`}
          />
        </button>

        {showModelSelect && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto animate-fade-in-up">
            <div className="p-3">
              {/* Free Models Section */}
              {freeModels.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400 mb-3 px-2">
                    <Star className="w-3 h-3" />
                    Free Models
                  </div>
                  <div className="space-y-1">
                    {freeModels.map((model) => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        onClick={() => handleModelSelect(model.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Models Section */}
              {premiumModels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-3 px-2">
                    <Zap className="w-3 h-3" />
                    Premium Models
                  </div>
                  <div className="space-y-1">
                    {premiumModels.map((model) => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        onClick={() => handleModelSelect(model.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 min-h-[44px] max-h-[120px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            rows={1}
          />
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className={`px-4 py-3 h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white border-0 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none ${
            disabled ? "cursor-not-allowed" : ""
          }`}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>

      {/* Helper text */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
        {disabled ? (
          <span className="flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Please wait for the response to complete
          </span>
        ) : (
          "Press Shift + Enter for new line, Enter to send"
        )}
      </div>
    </div>
  );
});
