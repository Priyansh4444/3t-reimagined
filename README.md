# CC Chat - AI Chat Application

A modern chat application built with Next.js, Convex, and Clerk authentication that supports multiple AI models.

## Features

- 🤖 **Multiple AI Models**: Support for Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o, and more
- 💬 **Real-time Chat**: Stream responses from AI models in real-time
- 📱 **Responsive Design**: Clean, modern UI that works on desktop and mobile
- 🔄 **Message Retry**: Retry messages with different models
- 📚 **Chat History**: Persistent chat threads with automatic title generation
- 🎨 **Markdown Support**: Rich text rendering with code highlighting and LaTeX math
- 🌙 **Dark Mode**: Built-in dark mode support
- 🔐 **Authentication**: Secure user authentication with Clerk

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (database, real-time sync, AI streaming)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4
- **AI Models**: OpenRouter (Gemini, Claude, GPT-4o, etc.)
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Convex](https://convex.dev/) account
- [Clerk](https://clerk.com/) account
- [OpenRouter](https://openrouter.ai/) API key

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd 3t-reimagined
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Deploy Convex functions**

   ```bash
   bun run convex dev
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

The app will be available at `http://localhost:3000`

## Usage

1. **Sign in/up** using Clerk authentication
2. **Start a new chat** by typing a message
3. **Select different models** using the settings button in the input area
4. **View chat history** by double-clicking the sidebar icon
5. **Retry messages** by hovering over assistant messages and clicking the retry button
6. **Delete chats** by clicking the trash icon in the sidebar

## Available Models

- **Google Gemini 2.5 Flash** - Fast and efficient
- **Anthropic Claude 3.5 Sonnet** - Balanced performance
- **OpenAI GPT-4o** - High-quality responses
- **Qwen 2.5 72B** - Large context window
- **DeepSeek Coder 33B** - Code-focused

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── ChatInterface.tsx # Main chat interface
│   ├── ChatSidebar.tsx   # Chat history sidebar
│   ├── ChatMessage.tsx   # Individual message component
│   └── ChatInput.tsx     # Message input with model selection
├── convex/               # Convex backend
│   ├── chat.ts          # Chat functions and AI integration
│   └── schema.ts        # Database schema
└── lib/                  # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

@T3-Chat Leaked Secret Sauce:
https://www.youtube.com/watch?v=tUKMPUlOCHY
