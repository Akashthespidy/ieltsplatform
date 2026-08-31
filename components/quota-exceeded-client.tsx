"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  CreditCard, 
  ArrowLeft, 
  ExternalLink, 
  RotateCcw, 
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  Info
} from "lucide-react";

export function QuotaExceededClient({ lang }: { lang: string }) {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push(`/${lang}/dashboard`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      {/* Main Glass Card */}
      <div className="border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-900/60 to-zinc-950/80 rounded-3xl p-8 sm:p-12 space-y-8 backdrop-blur shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <CreditCard className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <AlertCircle className="h-3.5 w-3.5" />
              API Credits Notice
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              OpenAI API Quota Exceeded
            </h1>
          </div>
        </div>

        {/* The Exact Requested Message Box */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-amber-500/20 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p className="font-mono bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 text-amber-200/90 select-all">
                You have no credits remaining. Add credits to continue using the API at{" "}
                <a
                  href="https://platform.openai.com/settings/organization/billing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 underline font-bold inline-flex items-center gap-1"
                >
                  https://platform.openai.com/settings/organization/billing/
                  <ExternalLink className="h-3.5 w-3.5 inline" />
                </a>
                .
              </p>
              <p className="text-zinc-400 text-xs italic">
                Note: This notice is displayed for testing and evaluation purposes. Once OpenAI credits are replenished, live evaluation will automatically resume.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-sm hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Return to Dashboard Button */}
          <Link
            href={`/${lang}/dashboard`}
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm hover:border-zinc-700"
          >
            <LayoutDashboard className="h-4 w-4 text-purple-400" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
