"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { Send, Settings, Sparkles } from "lucide-react";
import { AVAILABLE_MODELS } from "@/convex/chat";

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), selectedModel);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const selectedModelInfo = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel,
  );

  return (
    <div className="glass-effect border-t border-white/20 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift + Enter for new line)"
              className="resize-none min-h-[60px] max-h-[200px] pr-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/30 dark:border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200"
              disabled={disabled}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowModelSelect(!showModelSelect)}
                className="w-8 h-8 p-0 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
                title="Select model"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || disabled}
                className="w-8 h-8 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {showModelSelect && (
          <div className="glass-effect rounded-xl p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select AI Model
              </span>
            </div>
            <Select
              value={selectedModel}
              onChange={(e) => {
                onModelChange(e.target.value);
                setShowModelSelect(false);
              }}
              className="w-full bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </Select>
          </div>
        )}

        {selectedModelInfo && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {selectedModelInfo.name}
              </span>
            </div>
            <span>by {selectedModelInfo.provider}</span>
          </div>
        )}
      </form>
    </div>
  );
}
