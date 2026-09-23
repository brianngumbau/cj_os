import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CJ OS",
    template: "%s · CJ OS",
  },
  description: "Asynchronous operational dashboard for CJ Labs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
