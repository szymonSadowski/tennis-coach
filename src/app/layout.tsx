import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VideoProvider } from "@/contexts/video-context";
import { Analytics } from "@vercel/analytics/next";
import { ConvexClientProvider } from "@/lib/convex-provider";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tennis Coach AI",
  description: "AI-powered tennis coaching and analysis platform",
  icons: {
    icon: "/tennis-ball.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Analytics />
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex justify-between items-center p-4 h-16 border-b border-us-open-light-blue/20 bg-white/95">
            {/* Left: Tennis Ball Logo */}
            <div className="flex gap-32 items-center">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10">
                  <svg
                    className="w-full h-full text-tennis-yellow"
                    fill="currentColor"
                    viewBox="0 0 472.615 472.615"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M236.308,0C177.21,0,123.225,21.744,81.79,57.603c38.847,38.956,94.88,61.345,154.515,61.345
                    c59.623,0,115.662-22.388,154.52-61.346C349.39,21.744,295.404,0,236.308,0z"
                    />
                    <path
                      d="M236.372,353.665c-59.649,0-115.697,22.4-154.545,61.379c41.43,35.84,95.401,57.571,154.481,57.571
                    c59.113,0,113.111-21.755,154.55-57.631C352.01,376.042,295.978,353.665,236.372,353.665z"
                    />
                    <path
                      d="M405.246,71.146c-42.54,42.904-103.899,67.494-168.941,67.494c-65.055,0-126.407-24.587-168.944-67.486
                    C25.707,113.76,0,172.018,0,236.308c0,64.307,25.721,122.581,67.395,165.188c42.539-42.923,103.904-67.523,168.977-67.523
                    c65.021,0,126.371,24.576,168.910,67.459c41.636-42.601,67.334-100.849,67.334-165.124
                    C472.615,172.014,446.904,113.752,405.246,71.146z"
                    />
                  </svg>
                </div>
                <span className="font-bold text-us-open-navy text-lg">
                  Tennis Coach AI
                </span>
              </Link>

              {/* Center: Navigation (when logged in) */}
              <SignedIn>
                <nav className="flex justify-start items-start gap-6">
                  <Link
                    href="/history"
                    className="text-us-open-navy hover:text-us-open-light-blue transition-colors font-medium text-base font-semibold"
                  >
                    History
                  </Link>
                </nav>
              </SignedIn>
            </div>

            {/* Right: Authentication */}
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <Button className="us-open-button px-6 border-2 border-us-open-light-blue/50 hover:border-us-open-light-blue hover:bg-us-open-light-blue/10 text-us-open-navy rounded-md font-medium text-sm sm:text-base h-10 sm:h-12 cursor-pointer transition-all">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <ConvexClientProvider>
            <VideoProvider>{children}</VideoProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
