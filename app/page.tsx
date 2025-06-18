"use client";

import { useConvexAuth } from "convex/react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ChatInterface } from "@/components/ChatInterface";
import {
  Bot,
  Loader2,
  Sparkles,
  Zap,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Suspense } from "react";

// Loading component for better performance
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Initializing CC Chat...
            </p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Setting up your AI conversation experience
          </p>
        </div>
      </div>
    </div>
  );
}

// Optimized sign-in form with better animations
function SignInForm() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <div className="text-center space-y-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="relative mx-auto w-fit">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg animate-float">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CC Chat
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Experience intelligent conversations with AI
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Sparkles className="w-5 h-5" />
              <span>Multiple models • Fast responses • Secure</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SignInButton mode="modal">
              <button className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]">
                <span className="flex items-center justify-center gap-2">
                  Sign in to start chatting
                  <Zap className="w-5 h-5 group-hover:animate-pulse" />
                </span>
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 font-semibold text-lg transform hover:scale-[1.02] active:scale-[0.98]">
                Create an account
              </button>
            </SignUpButton>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">
            By continuing, you agree to our terms and privacy policy
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 dark:from-purple-950 dark:via-slate-900 dark:to-teal-950">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-12 space-y-8">
              <div className="relative">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                  CC Chat
                </h1>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-light leading-relaxed">
                  Experience the future of AI conversation with multiple models,
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent font-medium">
                    instant responses, and seamless interaction
                  </span>
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Sparkles className="w-5 h-5" />
                  <span>Multiple models • Fast responses • Secure</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mb-16">
              <Suspense
                fallback={
                  <div className="w-full max-w-md mx-auto p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-200 dark:border-purple-700">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-3/4 mx-auto"></div>
                      <div className="h-10 bg-purple-200 dark:bg-purple-700 rounded"></div>
                      <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                }
              >
                <SignInForm />
              </Suspense>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-200 dark:border-purple-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
                <MessageSquare className="w-8 h-8 text-purple-500 mb-3 mx-auto" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Multiple AI Models
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose from various AI models to find the perfect fit for your
                  needs
                </p>
              </div>
              <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-teal-200 dark:border-teal-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
                <Bot className="w-8 h-8 text-teal-500 mb-3 mx-auto" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Smart & Fast
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get intelligent responses quickly with optimized performance
                </p>
              </div>
              <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-violet-200 dark:border-violet-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-[1.02]">
                <Shield className="w-8 h-8 text-violet-500 mb-3 mx-auto" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Secure & Private
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your conversations are protected with enterprise-grade
                  security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatInterface />
    </Suspense>
  );
}
