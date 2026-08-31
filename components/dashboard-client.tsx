"use client";

import React, { useState } from "react";
import Link from "next/link";
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
import { 
  Award, 
  Flame, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  CheckCircle,
  CheckCircle2,
  Circle,
  BookOpen,
  PenTool,
  Mic,
  Volume2,
  Compass,
  ArrowRight,
  Target,
  Zap,
  Clock,
  Loader2
} from "lucide-react";
import { toggleStudyTaskAction } from "@/actions/practice";

interface StudyTask {
  id: string;
  label: string;
  isCompleted: boolean;
}

export default function DashboardClient({
  user,
  streak,
  recommendation,
  studyPlan,
  chartData,
  dict,
  lang,
}: {
  user: any;
  streak: any;
  recommendation: any;
  studyPlan: any;
  chartData: any;
  dict: any;
  lang?: string;
}) {
  const currentLang = lang || user?.preferredLanguage || "en";
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>(studyPlan?.tasks || []);
  const [togglingTaskId, setTogglingTaskId] = useState<string>("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!studyPlan?.id) return;
    setTogglingTaskId(taskId);
    try {
      const res = await toggleStudyTaskAction(studyPlan.id, taskId, !currentStatus);
      if (res.success && res.tasks) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error("Failed to toggle study task:", err);
    } finally {
      setTogglingTaskId("");
    }
  };

  // Decline warning detection - check if Grammar or Writing is low in strengths
  const grammarSkill = chartData.skillStrengths.find((s: any) => s.skill === "Grammar");
  const showDeclineWarning = grammarSkill && grammarSkill.score < 60;

  const quickLaunchItems = [
    { title: "Writing Essay", desc: "Task 1 & Task 2 AI grading", href: `/${currentLang}/writing`, icon: PenTool, color: "from-purple-500 to-pink-500", text: "text-purple-400" },
    { title: "Speaking Practice", desc: "Part 1-3 Whisper assessment", href: `/${currentLang}/speaking`, icon: Mic, color: "from-pink-500 to-rose-500", text: "text-pink-400" },
    { title: "Reading Passages", desc: "Speed & accuracy tests", href: `/${currentLang}/reading`, icon: BookOpen, color: "from-blue-500 to-cyan-500", text: "text-blue-400" },
    { title: "Listening Test", desc: "Interactive audio drills", href: `/${currentLang}/listening`, icon: Volume2, color: "from-emerald-500 to-teal-500", text: "text-emerald-400" },
    { title: "Vocabulary SM-2", desc: "Spaced repetition cards", href: `/${currentLang}/vocabulary`, icon: Compass, color: "from-amber-500 to-orange-500", text: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      
      {/* Dynamic Decline Alert Banner */}
      {showDeclineWarning && (
        <div className="flex items-start gap-4 p-5 bg-red-950/20 border border-red-500/30 rounded-3xl animate-pulse">
          <ShieldAlert className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-200">Decline Warning Detected</h4>
            <p className="text-xs text-red-300/80 leading-relaxed">
              {dict.dashboard.declineWarning || "Grammar accuracy has dipped below 60%. We recommend submitting an essay or placement check to reinforce fundamental structures."}
            </p>
          </div>
        </div>
      )}

      {/* Grid of core metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Streak */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur hover:border-zinc-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.streak}
            </span>
            <span className="text-2xl font-black text-white font-mono leading-tight">
              {streak?.currentStreak || 0} days
            </span>
            <span className="block text-[10px] text-zinc-600 font-semibold">Longest: {streak?.longestStreak || 0}d</span>
          </div>
        </div>

        {/* Metric 2: Estimated Band */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur hover:border-zinc-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.estimatedBand}
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono leading-tight">
              Band {user?.estimatedIeltsBand ? user.estimatedIeltsBand.toFixed(1) : "6.5"}
            </span>
            <span className="block text-[10px] text-zinc-600 font-semibold">Target: Band 7.5+</span>
          </div>
        </div>

        {/* Metric 3: CEFR Level */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur hover:border-zinc-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {dict.dashboard.cefrLevel}
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono leading-tight">
              Level {user?.cefrLevel || "B2"}
            </span>
            <span className="block text-[10px] text-zinc-600 font-semibold">Independent User</span>
          </div>
        </div>

        {/* Metric 4: Words Mastered */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 flex items-center gap-4 backdrop-blur hover:border-zinc-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Words Mastered
            </span>
            <span className="text-2xl font-black text-teal-300 font-mono leading-tight">
              {chartData.stats?.wordsLearned || 0}
            </span>
            <span className="block text-[10px] text-zinc-600 font-semibold">SuperMemo Spaced Rep</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Practice Bar */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-purple-400" />
          Quick Practice Launchpad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLaunchItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="group p-4 border border-zinc-800/80 bg-zinc-900/30 rounded-2xl hover:border-purple-500/40 hover:bg-zinc-900/60 transition-all flex flex-col justify-between gap-3 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} p-2 text-white group-hover:scale-105 transition-transform flex items-center justify-center`}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Weekly performance area chart */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">Weekly Performance Trend</h3>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-md">Live Accuracy %</span>
          </div>
          <div className="h-[260px] w-full min-w-0 relative text-xs">
            {mounted ? (
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
                <AreaChart data={chartData.weeklyPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#f4f4f5" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] w-full bg-zinc-900/10 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Chart 2: Radar chart representing coverages */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur lg:col-span-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">Skill Diagnostic Balance</h3>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-md">Radar</span>
          </div>
          <div className="h-[260px] w-full min-w-0 relative text-[10px] flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.skillStrengths}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="skill" stroke="#a1a1aa" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" tick={false} />
                  <Radar name="Skills" dataKey="score" stroke="#d946ef" fill="#d946ef" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] w-full bg-zinc-900/10 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Study Plan Checklist & Vocab Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Study Plan Card */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-5 backdrop-blur lg:col-span-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                {studyPlan?.title || dict.dashboard.dailyPlan}
              </h3>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {tasks.filter(t => t.isCompleted).length}/{tasks.length} Done
              </span>
            </div>

            {/* Tasks checklist */}
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.isCompleted)}
                  disabled={togglingTaskId === task.id}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                    task.isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {togglingTaskId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    ) : task.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <span className={`text-xs font-medium leading-tight ${task.isCompleted ? "line-through text-zinc-400" : ""}`}>
                    {task.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Recommendation Plan Card Info */}
            {recommendation && (
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">AI Examiner Advice</span>
                <p className="text-zinc-300 text-xs leading-relaxed italic">
                  &ldquo;{recommendation.data.dailyRecommendation}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vocab Acquisition line chart & Skill Progress bars */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-5 backdrop-blur lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">{dict.dashboard.vocabGrowth} & Skill Mastery</h3>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-md">Growth</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[200px] w-full min-w-0 relative text-xs">
              {mounted ? (
                <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                  <LineChart data={chartData.vocabGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                    <XAxis dataKey="week" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#f4f4f5" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] w-full bg-zinc-900/10 rounded-2xl animate-pulse" />
              )}
            </div>

            {/* Skill Breakdown Progress Bars */}
            <div className="space-y-3">
              {chartData.skillStrengths.slice(0, 4).map((skillItem: any, i: number) => {
                const colors = ["bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-amber-500"][i];
                return (
                  <div key={i} className="space-y-1.5 p-2.5 rounded-xl bg-zinc-950/30 border border-zinc-800/50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-300">{skillItem.skill}</span>
                      <span className="font-mono font-bold text-zinc-200">{skillItem.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors} rounded-full transition-all duration-1000`} style={{ width: `${skillItem.score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

