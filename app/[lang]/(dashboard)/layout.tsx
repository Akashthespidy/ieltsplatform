import React from "react";
import Link from "next/link";
import { getDictionary, Locale } from "@/lib/i18n";
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
  LogOut 
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const sidebarLinks = [
    { label: "Overview", href: `/${lang}/dashboard`, icon: LayoutDashboard },
    { label: "Vocabulary", href: `/${lang}/vocabulary`, icon: Compass },
    { label: "Reading Practice", href: `/${lang}/reading`, icon: BookOpen },
    { label: "Writing Essay", href: `/${lang}/writing`, icon: PenTool },
    { label: "Speaking Practice", href: `/${lang}/speaking`, icon: Mic },
    { label: "Listening Practice", href: `/${lang}/listening`, icon: Volume2 },
    { label: "Settings", href: `/${lang}/settings`, icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-900 bg-zinc-950 shrink-0">
        <div className="p-6 border-b border-zinc-900 flex items-center gap-2">
          <Globe className="h-6 w-6 text-purple-500 animate-pulse" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            LinguaTrack AI
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/60 transition-all border border-transparent hover:border-zinc-900"
            >
              <link.icon className="h-4.5 w-4.5 text-purple-400" />
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* User Card */}
        <div className="p-4 border-t border-zinc-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserButton />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-200">Learner Account</span>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">{lang} preferred</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur px-6 flex items-center justify-between z-10 sticky top-0">
          {/* Left spacer / Mobile Menu placeholder */}
          <div className="flex items-center gap-2 md:hidden">
            <Globe className="h-5 w-5 text-purple-500" />
            <span className="font-bold text-sm tracking-tight text-white">LinguaTrack</span>
          </div>

          <div className="hidden md:block" />

          {/* Right actions */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* Quick Streaks info */}
            <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-900/40 rounded-lg px-2.5 py-1 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="font-mono">Active Streak</span>
            </div>

            {/* Quick language selection links */}
            <div className="flex items-center gap-2 border border-zinc-900 px-2 py-1 rounded-lg">
              <Link href="/bn/dashboard" className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${lang === "bn" ? "bg-purple-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>BN</Link>
              <Link href="/ja/dashboard" className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${lang === "ja" ? "bg-purple-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>JA</Link>
              <Link href="/es/dashboard" className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${lang === "es" ? "bg-purple-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>ES</Link>
              <Link href="/en/dashboard" className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${lang === "en" ? "bg-purple-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>EN</Link>
            </div>

            <div className="md:hidden flex items-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Dynamic child layouts */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
