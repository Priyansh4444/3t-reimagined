import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only load when needed for code blocks
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "CC Chat - AI-Powered Conversations",
    template: "%s | CC Chat",
  },
  description:
    "Experience intelligent conversations with multiple AI models in a beautiful, modern interface. Fast, secure, and optimized for productivity.",
  keywords: [
    "AI chat",
    "artificial intelligence",
    "conversation",
    "productivity",
    "multiple models",
    "secure chat",
  ],
  authors: [{ name: "CC Chat Team" }],
  creator: "CC Chat",
  publisher: "CC Chat",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/convex.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://ccchat.app",
    title: "CC Chat - AI-Powered Conversations",
    description:
      "Experience intelligent conversations with multiple AI models in a beautiful, modern interface.",
    siteName: "CC Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "CC Chat - AI-Powered Conversations",
    description:
      "Experience intelligent conversations with multiple AI models in a beautiful, modern interface.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://ccchat.app",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.convex.cloud" />
        <link rel="dns-prefetch" href="https://clerk.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800`}
        suppressHydrationWarning
      >
        <ClerkProvider
          dynamic
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: "#3b82f6",
              borderRadius: "0.75rem",
            },
          }}
        >
          <ConvexClientProvider>
            <div className="chat-container h-full">{children}</div>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
