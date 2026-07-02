"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  Mic,
  Square,
  RefreshCw,
  Sparkles,
  Award,
  FileText,
  Loader2,
  Lightbulb,
  MessageSquare,
  Volume2,
  TrendingUp,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Shield,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { speakingTranscriptAtom, speakingResultAtom } from "@/lib/store";

interface Prompt {
  id: string;
  topic: string;
  instruction: string;
}

interface SpeakingEvaluation {
  fluencyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  vocabularyScore: number;
  feedback: string;
}

// Band descriptor text for speaking criteria
function getSpeakingDescriptor(score: number, type: "fluency" | "grammar" | "pronunciation" | "vocabulary"): string {
  const band = Math.round((score / 100) * 9 * 2) / 2;
  const descriptors: Record<string, Record<string, string>> = {
    fluency: {
      high: "Speaks at length with natural-sounding flow; only occasional hesitation for content-based thought.",
      mid: "Maintains flow with occasional repetition or self-correction; some hesitation but overall clear.",
      low: "Frequent pausing and hesitation; slow delivery that impedes comprehension at times.",
    },
    grammar: {
      high: "Uses a wide range of structures with flexibility; errors are rare and do not impede communication.",
      mid: "Uses a mix of simple and complex forms; some systematic errors but generally clear meaning.",
      low: "Limited range of structures; errors are frequent and may cause misunderstanding.",
    },
    pronunciation: {
      high: "Consistently uses a full range of pronunciation features; easy to understand throughout.",
      mid: "Generally intelligible; some features of L1 influence but communication is maintained.",
      low: "Difficult to understand throughout; strong L1 influence with frequent pronunciation errors.",
    },
    vocabulary: {
      high: "Uses vocabulary with full flexibility and precision; idiomatic use with only rare inaccuracies.",
      mid: "Uses adequate range for familiar topics; paraphrasing used when precise terms unavailable.",
      low: "Very limited range; only basic vocabulary with frequent repetition and inaccurate usage.",
    },
  };
  const level = band >= 7 ? "high" : band >= 5 ? "mid" : "low";
  return descriptors[type]?.[level] || "";
}

function getBandColor(score: number): { gradient: string; text: string; bg: string } {
  const band = (score / 100) * 9;
  if (band >= 7.5) return { gradient: "from-emerald-500 to-teal-500", text: "text-emerald-400", bg: "bg-emerald-500" };
  if (band >= 6.5) return { gradient: "from-teal-500 to-cyan-500", text: "text-teal-400", bg: "bg-teal-500" };
  if (band >= 5.5) return { gradient: "from-blue-500 to-indigo-500", text: "text-blue-400", bg: "bg-blue-500" };
  if (band >= 4.5) return { gradient: "from-amber-500 to-orange-500", text: "text-amber-400", bg: "bg-amber-500" };
  return { gradient: "from-red-500 to-rose-500", text: "text-red-400", bg: "bg-red-500" };
}

function estimateSpeakingBand(evaluation: SpeakingEvaluation): number {
  const avg = (evaluation.fluencyScore + evaluation.grammarScore + evaluation.pronunciationScore + evaluation.vocabularyScore) / 4;
  return Math.round(((avg / 100) * 9) * 2) / 2;
}

// Waveform visualizer bars
function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-10">
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? "bg-red-500" : "bg-zinc-700"}`}
          style={{
            height: active
              ? `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 20}%`
              : `${10 + Math.sin(i * 0.5) * 10}%`,
            animationDuration: active ? `${0.3 + (i % 5) * 0.1}s` : undefined,
            animation: active ? "pulse 0.5s ease-in-out infinite alternate" : undefined,
            animationDelay: active ? `${i * 0.03}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function SpeakingClient({
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

  const { isRecording, audioBlob, recordingTime, startRecording, stopRecording } = useAudioRecorder();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useAtom(speakingResultAtom) as any;
  const [expandedSection, setExpandedSection] = useState<string | null>("scorecard");

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const handleStart = () => {
    setResult(null);
    startRecording();
  };

  const handleStop = async () => {
    stopRecording();
  };

  const handleEvaluate = async () => {
    if (!audioBlob) {
      alert("Please record audio before evaluating.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "user-speaking.wav");

      const response = await fetch("/api/speaking/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult({
          transcript: data.transcript,
          evaluation: data.evaluation,
        });
        setExpandedSection("scorecard");
      } else {
        alert(data.error || "An error occurred during evaluation.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to analyze audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const speakingBand = result ? estimateSpeakingBand(result.evaluation) : null;
  const bandStyle = speakingBand ? getBandColor(((speakingBand / 9) * 100)) : null;

  // Parse AI feedback into coaching suggestions
  const coachingSuggestions = result?.evaluation?.feedback
    ? result.evaluation.feedback
        .split(/\n|(?:\d+\.\s)/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 15)
        .slice(0, 5)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

      {/* ===================== LEFT: Recorder + Transcript ===================== */}
      <div className="lg:col-span-2 space-y-6">

        {/* Professional Intro Panel (no recording yet) */}
        {!result && !audioBlob && !isRecording && (
          <div className="border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 rounded-3xl p-6 space-y-4 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Brain className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">IELTS Speaking Assessment</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our AI examiner evaluates your spoken English across the four official IELTS Speaking criteria: <strong className="text-zinc-300">Fluency & Coherence</strong>, <strong className="text-zinc-300">Lexical Resource</strong>, <strong className="text-zinc-300">Grammatical Range</strong>, and <strong className="text-zinc-300">Pronunciation</strong>.
                </p>
              </div>
            </div>

            {/* What AI evaluates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Fluency", desc: "Natural flow & hesitation", icon: TrendingUp, color: "text-purple-400" },
                { label: "Pronunciation", desc: "Clarity & intelligibility", icon: Volume2, color: "text-pink-400" },
                { label: "Grammar", desc: "Range & accuracy", icon: Target, color: "text-teal-400" },
                { label: "Vocabulary", desc: "Variety & precision", icon: BookOpen, color: "text-amber-400" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/50 gap-1.5">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-[11px] font-bold text-zinc-300">{item.label}</span>
                  <span className="text-[10px] text-zinc-500">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Recording tips */}
            <div className="space-y-2 border-t border-zinc-800/40 pt-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3 text-amber-400" /> Tips for best results
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { tip: "Speak for at least 60 seconds", icon: "⏱️" },
                  { tip: "Use a quiet environment", icon: "🔇" },
                  { tip: "Use complex sentence structures", icon: "📝" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-950/30 rounded-xl p-2.5 border border-zinc-800/50">
                    <span>{t.icon}</span>
                    {t.tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prompt Selector */}
        <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Speaking Topics</span>
            <div className="flex gap-2">
              {prompts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePromptIndex(idx);
                    setResult(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    activePromptIndex === idx
                      ? "border-purple-500 bg-purple-950/10 text-purple-300"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Topic {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">{activePrompt.topic}</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">{activePrompt.instruction}</p>
          </div>
        </div>

        {/* Recording Panel */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[260px] backdrop-blur relative overflow-hidden">

          {/* Animated wave background while recording */}
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <div className="w-64 h-64 rounded-full border border-red-500 animate-ping" />
              <div className="absolute w-48 h-48 rounded-full border border-red-400 animate-ping" style={{ animationDelay: "0.3s" }} />
              <div className="absolute w-32 h-32 rounded-full border border-red-300 animate-ping" style={{ animationDelay: "0.6s" }} />
            </div>
          )}

          {/* Status + timer */}
          <div className="flex flex-col items-center space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <span className={`text-xs font-bold uppercase tracking-wider ${isRecording ? "text-red-400" : "text-zinc-500"}`}>
                {isRecording ? "Recording in progress..." : audioBlob && !isRecording ? "Recording complete" : "Speech Recorder"}
              </span>
            </div>
            <span className={`text-4xl font-black font-mono ${isRecording ? "text-white" : "text-zinc-500"}`}>
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Waveform */}
          <div className="relative z-10">
            <WaveformBars active={isRecording} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 relative z-10">
            {!isRecording ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 hover:scale-105 hover:shadow-red-500/40"
                title="Start Recording"
              >
                <Mic className="h-4 w-4" />
                {audioBlob ? "Re-record" : "Start Recording"}
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm transition-all shadow-lg hover:scale-105"
                title="Stop Recording"
              >
                <Square className="h-4 w-4 text-red-400" />
                Stop Recording
              </button>
            )}

            {audioBlob && !isRecording && (
              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 hover:scale-105"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Evaluate Speech
                  </>
                )}
              </button>
            )}
          </div>

          {audioBlob && !isRecording && !result && (
            <p className="text-[11px] text-zinc-500 font-semibold italic relative z-10">
              ✓ Audio captured — click &ldquo;Evaluate Speech&rdquo; for your AI examiner report.
            </p>
          )}
        </div>

        {/* Transcript Panel */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl overflow-hidden backdrop-blur">
            <button
              onClick={() => setExpandedSection(expandedSection === "transcript" ? null : "transcript")}
              className="w-full flex items-center justify-between p-5 border-b border-zinc-800 hover:bg-zinc-900/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-zinc-200">{dict.speaking.transcript}</span>
              </div>
              {expandedSection === "transcript" ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>

            {expandedSection === "transcript" && (
              <div className="p-5 sm:p-6 space-y-3">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">AI Transcription</p>
                <div className="relative p-5 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-zinc-500 font-semibold uppercase">Whisper AI</span>
                  </div>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap italic">
                    &ldquo;{result.transcript}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== RIGHT: AI Examiner Report ===================== */}
      <div className="space-y-5">
        {result ? (
          <div className="space-y-5">

            {/* Band Gauge + Overall */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  AI Examiner Scorecard
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider border border-zinc-800 px-2 py-0.5 rounded-md">
                  IELTS Aligned
                </span>
              </div>

              {/* Band display */}
              <div className="flex flex-col items-center py-5 border border-zinc-800 bg-zinc-950/60 rounded-2xl gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estimated Speaking Band</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-black font-mono bg-gradient-to-r ${bandStyle?.gradient} bg-clip-text text-transparent`}>
                    {speakingBand?.toFixed(1)}
                  </span>
                  <span className="text-zinc-600 text-lg font-bold">/ 9</span>
                </div>
                {/* Mini band scale */}
                <div className="flex gap-1 items-center mt-1">
                  {[1,2,3,4,5,6,7,8,9].map((b) => (
                    <div
                      key={b}
                      className={`transition-all rounded-full ${
                        b <= Math.floor(speakingBand || 0) ? `${bandStyle?.bg} h-2 w-2` : "bg-zinc-800 h-1.5 w-1.5"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">
                  Band {speakingBand} — {speakingBand && speakingBand >= 7.5 ? "Very Good" : speakingBand && speakingBand >= 6.5 ? "Competent" : speakingBand && speakingBand >= 5.5 ? "Modest" : "Limited"}
                </span>
              </div>

              {/* 4-criterion scorecard */}
              <div className="space-y-3">
                {[
                  { label: "Fluency & Coherence", val: result.evaluation.fluencyScore, icon: TrendingUp, type: "fluency" as const },
                  { label: "Pronunciation", val: result.evaluation.pronunciationScore, icon: Volume2, type: "pronunciation" as const },
                  { label: "Grammatical Range", val: result.evaluation.grammarScore, icon: Target, type: "grammar" as const },
                  { label: "Lexical Resource", val: result.evaluation.vocabularyScore, icon: BookOpen, type: "vocabulary" as const },
                ].map((item, idx) => {
                  const colors = [
                    { bar: "bg-purple-500", text: "text-purple-400" },
                    { bar: "bg-pink-500", text: "text-pink-400" },
                    { bar: "bg-teal-500", text: "text-teal-400" },
                    { bar: "bg-amber-500", text: "text-amber-400" },
                  ][idx];

                  return (
                    <div key={idx} className="space-y-2 p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <item.icon className={`h-3 w-3 ${colors.text}`} />
                          <span className="text-[11px] font-bold text-zinc-400">{item.label}</span>
                        </div>
                        <span className={`text-xs font-black ${colors.text}`}>{item.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} rounded-full transition-all duration-1000`}
                          style={{ width: `${item.val}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                        {getSpeakingDescriptor(item.val, item.type)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Examiner Commentary */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-5 space-y-3 backdrop-blur">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                Examiner Feedback
              </h3>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <p className="text-zinc-400 text-xs leading-relaxed pl-4 italic">
                  &ldquo;{coachingSuggestions[0] || result.evaluation.feedback}&rdquo;
                </p>
              </div>
            </div>

            {/* AI Coaching Suggestions */}
            {coachingSuggestions.length > 1 && (
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-5 space-y-3 backdrop-blur">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  AI Coaching Suggestions
                </h3>
                <div className="space-y-2">
                  {coachingSuggestions.slice(1).map((s: string, i: number) => (
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

          </div>
        ) : (
          /* Empty state */
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 flex flex-col items-center justify-center space-y-5 min-h-[350px] text-center backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
              <Mic className="h-6 w-6 text-zinc-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-400">Examiner Report Pending</h3>
              <p className="text-xs text-zinc-600 max-w-[200px] leading-relaxed">
                Record and submit your speech to receive a full IELTS-aligned AI examiner report.
              </p>
            </div>
            <div className="w-full space-y-2 text-left">
              {[
                "Estimated IELTS speaking band",
                "4-criterion scorecard",
                "Band descriptor explanations",
                "Examiner commentary",
                "AI coaching suggestions",
                "Full Whisper transcription",
              ].map((item, i) => (
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
