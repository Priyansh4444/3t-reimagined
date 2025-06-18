"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { ChatInterface } from "@/components/ChatInterface";
import { Sparkles, Bot } from "lucide-react";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 glass-effect border-b border-white/20 p-4 flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">CC Chat</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by AI
            </p>
          </div>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10 shadow-lg",
            },
          }}
        />
      </header>
      <main className="h-[calc(100vh-80px)]">
        <Authenticated>
          <ChatInterface />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto items-center justify-center h-full">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">CC Chat</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to start chatting with AI models
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <SignInButton mode="modal">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="glass-effect text-gray-900 dark:text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold">
            Sign up
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}
