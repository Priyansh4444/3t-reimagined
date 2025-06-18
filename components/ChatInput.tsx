"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Send, ChevronDown, Star, Zap } from "lucide-react";
import { AVAILABLE_MODELS } from "@/convex/chat";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  placeholder?: string;
}

export function ChatInput({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      console.log("📤 Submitting message from ChatInput");
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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

  const selectedModelInfo = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel,
  );

  // Group models by category
  const freeModels = AVAILABLE_MODELS.filter((m) => m.free);
  const premiumModels = AVAILABLE_MODELS.filter((m) => !m.free);

  return (
    <div className="space-y-3">
      {/* Model Selector */}
      <div className="relative" ref={modelSelectRef}>
        <button
          type="button"
          onClick={() => setShowModelSelect(!showModelSelect)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors w-full"
        >
          <div className="flex items-center gap-2">
            {selectedModelInfo?.free ? (
              <Star className="w-4 h-4 text-green-500" />
            ) : (
              <Zap className="w-4 h-4 text-purple-500" />
            )}
            <span className="font-medium text-gray-700">
              {selectedModelInfo?.name || "Unknown Model"}
            </span>
            {selectedModelInfo?.free && (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                FREE
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ml-auto ${showModelSelect ? "rotate-180" : ""}`}
          />
        </button>

        {showModelSelect && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            <div className="p-2">
              {/* Free Models Section */}
              {freeModels.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-green-600 mb-2 px-2">
                    <Star className="w-3 h-3" />
                    Free Models
                  </div>
                  {freeModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        console.log(`🤖 Selecting model: ${model.name}`);
                        onModelChange(model.id);
                        setShowModelSelect(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedModel === model.id
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs opacity-60">
                            {model.provider}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            FREE
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Premium Models Section */}
              {premiumModels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-600 mb-2 px-2">
                    <Zap className="w-3 h-3" />
                    Premium Models
                  </div>
                  {premiumModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        console.log(`🤖 Selecting model: ${model.name}`);
                        onModelChange(model.id);
                        setShowModelSelect(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedModel === model.id
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs opacity-60">
                            {model.provider}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-purple-600 font-medium">
                            PREMIUM
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
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
            className="w-full resize-none min-h-[50px] max-h-[120px] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 bg-white shadow-sm"
            disabled={disabled}
            rows={1}
          />
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors min-w-[44px] h-[50px] flex items-center justify-center"
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Model Info */}
      {selectedModelInfo && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              selectedModelInfo.free
                ? "bg-green-50 text-green-700"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {selectedModelInfo.free ? (
              <Star className="w-3 h-3" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            <span className="font-medium">{selectedModelInfo.name}</span>
            {selectedModelInfo.free && (
              <span className="ml-1 text-xs font-bold">FREE</span>
            )}
          </div>
          <span>by {selectedModelInfo.provider}</span>
        </div>
      )}
    </div>
  );
}
