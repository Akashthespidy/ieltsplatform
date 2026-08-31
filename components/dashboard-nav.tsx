"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  PenTool, 
  Mic, 
  Volume2, 
  Compass, 
  Settings, 
  Globe, 
  Flame, 
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function DashboardNav({ 
  lang,
  children 
}: { 
  lang: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarLinks = [
    { label: "Overview", href: `/${lang}/dashboard`, icon: LayoutDashboard },
    { label: "Vocabulary", href: `/${lang}/vocabulary`, icon: Compass },
    { label: "Reading Practice", href: `/${lang}/reading`, icon: BookOpen },
    { label: "Writing Essay", href: `/${lang}/writing`, icon: PenTool },
    { label: "Speaking Practice", href: `/${lang}/speaking`, icon: Mic },
    { label: "Listening Practice", href: `/${lang}/listening`, icon: Volume2 },
    { label: "Settings", href: `/${lang}/settings`, icon: Settings },
  ];

  // Helper to get active page title
  const activeLink = sidebarLinks.find((l) => pathname === l.href);
  const activeTitle = activeLink ? activeLink.label : "Dashboard";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans w-full">
      {/* ===================== Left Desktop Sidebar ===================== */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-900 bg-zinc-950 shrink-0 select-none sticky top-0 h-screen">
        <div className="h-16 px-6 border-b border-zinc-900 flex items-center justify-between">
          <Link href={`/${lang}/dashboard`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shadow-purple-500/20">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              LinguaTrack AI
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-purple-950/30 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-950/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className={`h-4.5 w-4.5 ${isActive ? "text-purple-400" : "text-zinc-500"}`} />
                  <span>{link.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-purple-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-zinc-900 flex items-center justify-between gap-3 bg-zinc-950">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-200">Learner Profile</span>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">{lang} preferred</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================== Right Main Column ===================== */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur px-4 sm:px-8 flex items-center justify-between z-20 sticky top-0 w-full">
          {/* Left: Mobile hamburger & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white md:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile logo */}
            <Link href={`/${lang}/dashboard`} className="flex items-center gap-2 md:hidden">
              <Globe className="h-5 w-5 text-purple-400" />
              <span className="font-extrabold text-sm tracking-tight text-white">LinguaTrack</span>
            </Link>

            {/* Desktop breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <span className="text-zinc-500">IELTS Prep</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-200 font-bold">{activeTitle}</span>
            </div>
          </div>

          {/* Right actions: Study Streak badge + user avatar on mobile */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 border border-orange-500/20 bg-orange-950/20 rounded-xl px-3 py-1.5 text-orange-400 shadow-sm">
              <Flame className="h-3.5 w-3.5 fill-orange-400" />
              <span className="font-mono text-xs font-bold">Study Streak</span>
            </div>

            <div className="md:hidden flex items-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-8">
          {children}
        </main>
      </div>

      {/* ===================== Mobile Drawer Navigation ===================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-zinc-950/95 backdrop-blur-lg animate-fadeIn p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Globe className="h-6 w-6 text-purple-400" />
              <span className="font-extrabold text-base tracking-tight text-white">LinguaTrack AI</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className={`h-5 w-5 ${isActive ? "text-purple-400" : "text-zinc-500"}`} />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton />
              <span className="text-xs font-bold text-zinc-300">Learner Profile</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
