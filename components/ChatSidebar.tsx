"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/button";
import { MessageSquare, Trash2, Plus, Sparkles, Clock } from "lucide-react";
import { useMutation } from "convex/react";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  selectedThreadId,
  onSelectThread,
  onNewChat,
}: ChatSidebarProps) {
  const threads = useQuery(api.chat.listThreads);
  const deleteThread = useMutation(api.chat.deleteThread);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteThread({ threadId });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) {
    return (
      <div className="w-16 glass-effect border-r border-white/20 flex flex-col items-center py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-12 h-12 p-0 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
        <div className="mt-4 text-center">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-600 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 glass-effect border-r border-white/20 flex flex-col">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold gradient-text">Chats</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="w-10 h-10 p-0 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your AI conversations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {threads?.page?.map((thread) => (
          <div
            key={thread._id}
            className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedThreadId === thread._id
                ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 shadow-lg"
                : "hover:bg-white/10 border border-transparent hover:border-white/20"
            }`}
            onClick={() => onSelectThread(thread._id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {thread.title || "New Chat"}
                  </p>
                </div>
                {thread.summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                    {thread.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(thread._creationTime)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleDeleteThread(thread._id, e);
                }}
                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/20 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {(!threads?.page || threads.page.length === 0) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              No conversations yet
            </p>
            <p className="text-xs text-gray-500">
              Start your first chat to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
