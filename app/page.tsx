"use client";

import { useConvexAuth } from "convex/react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ChatInterface } from "@/components/ChatInterface";
import { Bot, Loader2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  return <ChatInterface />;
}

function SignInForm() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">CC Chat</h1>
            <p className="text-gray-600">
              Experience intelligent conversations with AI
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold">
                Sign in to start chatting
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold">
                Create an account
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
