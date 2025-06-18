"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/button";
import { MessageSquare, Trash2, Plus, Clock } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => Promise<void>;
}

interface Thread {
  _id: string;
  title?: string;
  _creationTime: number;
}

export function ChatSidebar({
  selectedThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
}: ChatSidebarProps) {
  const threads = useQuery(api.chat.listThreads);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingThreadId(threadId);
    try {
      await onDeleteThread(threadId);
    } finally {
      setDeletingThreadId(null);
    }
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

  const getThreadPreview = (thread: Thread) => {
    // Truncate title for preview
    const title = thread.title || "New Chat";
    return title.length > 40 ? title.slice(0, 40) + "..." : title;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium py-2 px-4 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads?.page?.map((thread) => (
          <div
            key={thread._id}
            className={`group relative mx-2 my-1 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedThreadId === thread._id
                ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                : "hover:bg-gray-50 border-l-4 border-transparent"
            } ${deletingThreadId === thread._id ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => onSelectThread(thread._id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getThreadPreview(thread)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(thread._creationTime)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) =>
                    handleDeleteThread(thread._id, e)
                  }
                  className="w-7 h-7 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                  disabled={deletingThreadId === thread._id}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Loading indicator for deleting */}
            {deletingThreadId === thread._id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {(!threads?.page || threads.page.length === 0) && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Start your first chat to see it here
            </p>
            <Button
              onClick={onNewChat}
              variant="outline"
              size="sm"
              className="mx-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create First Chat
            </Button>
          </div>
        )}

        {/* Loading State */}
        {threads === undefined && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
