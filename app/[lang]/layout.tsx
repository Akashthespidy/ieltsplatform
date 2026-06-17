import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinguaTrack AI - AI-Powered English Learning",
  description: "Evaluate your level and improve vocabulary, reading, writing, and speaking with advanced AI assessments.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <ClerkProvider>
      <html
        lang={lang}
        className={`${geistSans.variable} ${geistMono.variable} h-full dark`}
        style={{ colorScheme: "dark" }}
      >
        <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 antialiased font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
