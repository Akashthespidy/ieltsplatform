"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { submitEssayAction } from "@/actions/practice";
import {
  PenTool,
  CheckCircle,
  Sparkles,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Loader2,
  Star,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  FileText,
  Zap,
} from "lucide-react";
import { writingEssayTextAtom, writingResultAtom } from "@/lib/store";

interface Prompt {
  id: string;
  title: string;
  description: string;
}

interface Mistake {
  originalText: string;
  improvedText: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

interface EvaluationResult {
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  estimatedBand: number;
  mistakes: Mistake[];
  improvedVersion: string;
  studyPlan: string;
}

// IELTS Band descriptor text per score range
function getBandDescriptor(score: number, type: "grammar" | "vocabulary" | "coherence"): string {
  const band = Math.round((score / 100) * 9 * 2) / 2; // map to 0-9 scale
  if (band >= 8) {
    if (type === "grammar") return "Wide range of grammatical structures used flexibly and accurately with only minor lapses.";
    if (type === "vocabulary") return "Sophisticated control of lexical features; rare minor errors occur only as slips.";
    return "Sequences of ideas are well-managed; logical paragraph structure with clear progression.";
  } else if (band >= 7) {
    if (type === "grammar") return "A variety of complex structures are used with flexibility, and most sentences error-free.";
    if (type === "vocabulary") return "Resource fluently and flexibly to convey precise meanings; skilled use of uncommon items.";
    return "Ideas are arranged coherently; referencing and substitution are well-managed.";
  } else if (band >= 6) {
    if (type === "grammar") return "Mix of simple and complex sentence forms; some errors but these rarely impede communication.";
    if (type === "vocabulary") return "Adequate range of vocabulary for familiar topics; errors do not impede comprehension.";
    return "Organises information with overall progression; uses cohesive devices effectively but mechanical at times.";
  } else if (band >= 5) {
    if (type === "grammar") return "Limited range of structures with some evidence of complex forms but frequent grammatical errors.";
    if (type === "vocabulary") return "Noticeable paraphrasing; limited but adequate range with some inappropriate word choice.";
    return "Presents information but does not progress logically; some misuse of cohesive devices.";
  } else {
    if (type === "grammar") return "Basic sentence forms only; frequent repetitions and errors that may impede communication.";
    if (type === "vocabulary") return "Basic vocabulary only; errors in word choice and form may impede communication.";
    return "Limited organisation; ideas may be presented in disconnected sequences.";
  }
}

function getBandColor(band: number): string {
  if (band >= 8) return "from-emerald-400 to-teal-400";
  if (band >= 7) return "from-teal-400 to-cyan-400";
  if (band >= 6) return "from-blue-400 to-indigo-400";
  if (band >= 5) return "from-amber-400 to-orange-400";
  return "from-red-400 to-rose-400";
}

function getBandLabel(band: number): string {
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Intermittent";
}

// Circular score ring component
function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function WritingClient({
  prompts,
  dict,
}: {
  prompts: Prompt[];
  dict: any;
}) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const activePrompt = prompts[activePromptIndex];

  const [essayText, setEssayText] = useAtom(writingEssayTextAtom);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useAtom(writingResultAtom) as any;
  const [activeMistake, setActiveMistake] = useState<Mistake | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("mistakes");

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const wordCount = essayText.trim() === "" ? 0 : essayText.trim().split(/\s+/).length;

  const handleSubmit = async () => {
    if (wordCount < 10) {
      alert("Please write a longer essay (minimum 10 words for test).");
      return;
    }

    setSubmitting(true);
    setResult(null);
    setActiveMistake(null);
    setExpandedSection("mistakes");
    try {
      const res = await submitEssayAction(essayText);
      if (res.success && res.evaluation) {
        setResult(res.evaluation as EvaluationResult);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderHighlightedEssay = (text: string, mistakes: Mistake[]) => {
    if (!mistakes || mistakes.length === 0)
      return <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{text}</p>;

    const sortedMistakes = [...mistakes].sort((a, b) => a.startIndex - b.startIndex);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMistakes.forEach((mistake, idx) => {
      if (mistake.startIndex > lastIndex) {
        elements.push(<span key={`text-${idx}`}>{text.slice(lastIndex, mistake.startIndex)}</span>);
      }
      const errorWord = text.slice(mistake.startIndex, mistake.endIndex);
      elements.push(
        <button
          key={`err-${idx}`}
          onClick={() => setActiveMistake(activeMistake?.startIndex === mistake.startIndex ? null : mistake)}
          className={`px-1 rounded border-b-2 font-semibold transition-all ${
            activeMistake?.startIndex === mistake.startIndex
              ? "border-red-500 bg-red-950/30 text-red-200"
              : "border-red-500/60 bg-red-950/10 text-red-300 hover:bg-red-950/20"
          }`}
          title="Click to view correction"
        >
          {errorWord || mistake.originalText}
        </button>
      );
      lastIndex = mistake.endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return (
      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{elements}</p>
    );
  };

  const bandColor = result ? getBandColor(result.estimatedBand) : "";
  const bandLabel = result ? getBandLabel(result.estimatedBand) : "";

  // Parse study plan into suggestions list
  const suggestions = result?.studyPlan
    ? result.studyPlan
        .split(/\n|(?:\d+\.\s)/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)
        .slice(0, 6)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

      {/* ===================== LEFT: Input + Diagnostics ===================== */}
      <div className="lg:col-span-2 space-y-6">

        {/* Professional Intro Banner (when no essay yet) */}
        {!result && essayText.length === 0 && (
          <div className="border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-pink-950/20 rounded-3xl p-6 space-y-4 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">IELTS Writing Task Evaluation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our AI evaluates your essay across the four official IELTS Writing Band Descriptors: <strong className="text-zinc-300">Task Achievement</strong>, <strong className="text-zinc-300">Coherence & Cohesion</strong>, <strong className="text-zinc-300">Lexical Resource</strong>, and <strong className="text-zinc-300">Grammatical Range & Accuracy</strong>.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Grammar", band: "B1–C2", icon: Target },
                { label: "Vocabulary", band: "Range & precision", icon: BookOpen },
                { label: "Coherence", band: "Flow & logic", icon: TrendingUp },
                { label: "Task Score", band: "Overall band", icon: Star },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/50 gap-1.5">
                  <item.icon className="h-4 w-4 text-purple-400" />
                  <span className="text-[11px] font-bold text-zinc-300">{item.label}</span>
                  <span className="text-[10px] text-zinc-500">{item.band}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 border-t border-zinc-800/40 pt-3">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span><strong className="text-amber-400">Tip:</strong> For best results, aim for 150–250 words using complex sentence structures and varied vocabulary.</span>
            </div>
          </div>
        )}

        {/* Prompt Selector */}
        <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Practice Prompts</span>
            <div className="flex gap-2">
              {prompts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePromptIndex(idx);
                    setResult(null);
                    setEssayText("");
                    setActiveMistake(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    activePromptIndex === idx
                      ? "border-purple-500 bg-purple-950/10 text-purple-300"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Prompt {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">{activePrompt.title}</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">{activePrompt.description}</p>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-4">
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            disabled={submitting}
            rows={10}
            placeholder={dict.writing.placeholder}
            className="w-full p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition-all font-sans leading-relaxed custom-scrollbar"
          />

          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-2">
            <span>
              Word Count:{" "}
              <strong className={wordCount >= 150 ? "text-emerald-400" : wordCount >= 80 ? "text-amber-400" : "text-zinc-300"}>
                {wordCount}
              </strong>{" "}
              words
            </span>
            <div className="flex items-center gap-3">
              <span className={`${wordCount >= 150 ? "text-emerald-400" : "text-zinc-500"} text-[10px]`}>
                {wordCount >= 150 ? "✓ Good length" : `${150 - wordCount} more for IELTS minimum`}
              </span>
              <span className="italic text-zinc-600">Target: 150–250 words</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || wordCount < 5}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {dict.writing.analyzing}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {dict.writing.submit}
              </>
            )}
          </button>
        </div>

        {/* Inline Diagnostics (post-result) */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl overflow-hidden backdrop-blur">
            {/* Section header */}
            <button
              onClick={() => setExpandedSection(expandedSection === "mistakes" ? null : "mistakes")}
              className="w-full flex items-center justify-between p-5 sm:p-6 border-b border-zinc-800 hover:bg-zinc-900/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-zinc-200">Inline Grammar & Spelling Diagnostics</span>
                {result.mistakes?.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-950/40 border border-red-500/20 rounded-full text-[10px] text-red-400 font-bold">
                    {result.mistakes.length} issues
                  </span>
                )}
              </div>
              {expandedSection === "mistakes" ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>

            {expandedSection === "mistakes" && (
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs text-zinc-400">
                  Click on any <span className="text-red-300 border-b border-red-500/60">underlined word</span> to see AI correction and explanation.
                </p>
                <div className="p-5 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  {renderHighlightedEssay(essayText, result.mistakes)}
                </div>

                {activeMistake && (
                  <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/20 space-y-3 animate-fadeIn">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Grammar Correction
                    </span>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-semibold block text-[10px] uppercase tracking-wider">Original</span>
                        <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20">
                          <span className="text-red-300 font-bold line-through">{activeMistake.originalText}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-semibold block text-[10px] uppercase tracking-wider">Correction</span>
                        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                          <span className="text-emerald-400 font-bold">{activeMistake.improvedText}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/60">
                      <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider block mb-1">Examiner Explanation</span>
                      <p className="text-zinc-300 text-xs leading-relaxed">{activeMistake.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== RIGHT: AI Examiner Report ===================== */}
      <div className="space-y-5">
        {result ? (
          <div className="space-y-5">

            {/* Main Band Score */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  AI Examiner Report
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider border border-zinc-800 px-2 py-0.5 rounded-md">
                  IELTS Aligned
                </span>
              </div>

              {/* Band gauge */}
              <div className="flex flex-col items-center py-4 border border-zinc-800 bg-zinc-950/60 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Overall Band Score</span>
                <div className="relative flex items-center justify-center">
                  <ScoreRing score={(result.estimatedBand / 9) * 100} color={bandColor} size={100} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black font-mono bg-gradient-to-r ${bandColor} bg-clip-text text-transparent`}>
                      {result.estimatedBand.toFixed(1)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold mt-2 bg-gradient-to-r ${bandColor} bg-clip-text text-transparent`}>
                  {bandLabel} User
                </span>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((b) => (
                    <div
                      key={b}
                      className={`w-2 h-2 rounded-full transition-all ${
                        b <= Math.floor(result.estimatedBand) ? "bg-purple-500" : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Criterion scores with band descriptors */}
              <div className="space-y-4">
                {[
                  { label: "Grammatical Range & Accuracy", val: result.grammarScore, color: "bg-purple-500", type: "grammar" as const, icon: Target },
                  { label: "Lexical Resource", val: result.vocabularyScore, color: "bg-pink-500", type: "vocabulary" as const, icon: BookOpen },
                  { label: "Coherence & Cohesion", val: result.coherenceScore, color: "bg-teal-500", type: "coherence" as const, icon: TrendingUp },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <item.icon className="h-3 w-3 text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-400">{item.label}</span>
                      </div>
                      <span className="text-xs font-black text-zinc-200">{item.val}<span className="text-zinc-600 font-normal">/100</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                      {getBandDescriptor(item.val, item.type)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Examiner Commentary */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-5 space-y-3 backdrop-blur">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                Examiner Commentary
              </h3>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <p className="text-zinc-400 text-xs leading-relaxed pl-4 italic">
                  &ldquo;{result.studyPlan?.split("\n")[0] || "Good attempt. Focus on expanding grammatical range and maintaining consistent coherence throughout the essay."}&rdquo;
                </p>
              </div>
            </div>

            {/* AI Improvement Suggestions */}
            {suggestions.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-5 space-y-3 backdrop-blur">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  AI Improvement Suggestions
                </h3>
                <div className="space-y-2">
                  {suggestions.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/50">
                      <span className="w-5 h-5 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-400 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-zinc-400 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Answer */}
            <div className="border border-emerald-500/20 bg-zinc-900/40 rounded-3xl p-5 space-y-3 backdrop-blur">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {dict.writing.improvedVersion}
                <span className="text-[10px] font-normal text-zinc-500 ml-auto border border-zinc-800 px-2 py-0.5 rounded-md">Model Answer</span>
              </h3>
              <div className="relative p-4 bg-emerald-950/10 border border-emerald-500/15 rounded-xl">
                <FileText className="absolute top-3 right-3 h-3.5 w-3.5 text-emerald-600 opacity-40" />
                <p className="text-zinc-300 text-xs leading-relaxed italic select-all">
                  &ldquo;{result.improvedVersion}&rdquo;
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* Empty state with guidance */
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 flex flex-col items-center justify-center space-y-5 min-h-[350px] text-center backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
              <PenTool className="h-6 w-6 text-zinc-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-400">AI Report Pending</h3>
              <p className="text-xs text-zinc-600 max-w-[200px] leading-relaxed">
                Submit your essay to receive a full IELTS-aligned AI examiner report with band scores and suggestions.
              </p>
            </div>
            <div className="w-full space-y-2 text-left">
              {["Band score across 4 criteria", "Inline grammar diagnostics", "Examiner commentary", "AI improvement suggestions", "Model answer"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-600">
                  <Zap className="h-3 w-3 text-zinc-700 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
