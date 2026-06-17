"use client";

import React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Award, Zap, Flame, ShieldAlert, Sparkles, TrendingUp, CheckCircle } from "lucide-react";

export default function DashboardClient({
  user,
  streak,
  recommendation,
  chartData,
  dict,
}: {
  user: any;
  streak: any;
  recommendation: any;
  chartData: any;
  dict: any;
}) {
  // Decline warning detection - check if Grammar is low in strengths
  const grammarSkill = chartData.skillStrengths.find((s: any) => s.skill === "Grammar");
  const showDeclineWarning = grammarSkill && grammarSkill.score < 60;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Decline Alert Banner */}
      {showDeclineWarning && (
        <div className="flex items-start gap-4 p-5 bg-red-950/20 border border-red-500/30 rounded-3xl animate-pulse">
          <ShieldAlert className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-200">Decline Warning Detected</h4>
            <p className="text-xs text-red-300/80 leading-relaxed">
              {dict.dashboard.declineWarning}
            </p>
          </div>
        </div>
      )}

      {/* Grid of core metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1: Streak */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.streak}
            </span>
            <span className="text-2xl font-black text-white font-mono leading-tight">
              {streak?.currentStreak || 0} days
            </span>
          </div>
        </div>

        {/* Metric 2: Estimated Band */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.estimatedBand}
            </span>
            <span className="text-2xl font-black text-white font-mono leading-tight">
              Band {user?.estimatedIeltsBand?.toFixed(1) || "6.5"}
            </span>
          </div>
        </div>

        {/* Metric 3: CEFR Level */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.cefrLevel}
            </span>
            <span className="text-2xl font-black text-white font-mono leading-tight">
              Level {user?.cefrLevel || "B2"}
            </span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Weekly performance area chart */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-300">Weekly Performance Trend</h3>
          <div className="h-[260px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weeklyPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#f4f4f5" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Radar chart representing coverages */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-1">
          <h3 className="text-sm font-bold text-zinc-300">Skill Diagnostic distribution</h3>
          <div className="h-[260px] w-full text-[10px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData.skillStrengths}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="skill" stroke="#a1a1aa" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" tick={false} />
                <Radar name="Skills" dataKey="score" stroke="#d946ef" fill="#d946ef" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Study Plan & Vocab Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendation Plan Card */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-1">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-400" />
            {dict.dashboard.dailyPlan}
          </h3>

          {recommendation ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 leading-relaxed text-zinc-300">
                {recommendation.data.dailyRecommendation}
              </div>

              {recommendation.data.strengths && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-500 text-[10px] uppercase">Detected Strengths:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recommendation.data.strengths.map((s: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.data.weaknesses && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-500 text-[10px] uppercase">Weak areas:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recommendation.data.weaknesses.map((w: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-red-950/30 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs italic">
              {dict.dashboard.noRecommendations}
            </p>
          )}
        </div>

        {/* Vocab Acquisition line chart */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-300">{dict.dashboard.vocabGrowth}</h3>
          <div className="h-[200px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.vocabGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#f4f4f5" }}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
