"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { completeOnboardingAction } from "@/actions/user";
import {
  Globe,
  BookOpen,
  Check,
  Loader2,
  Award,
  Zap,
  AlertCircle,
  Brain,
  ChevronRight,
  SkipForward,
  Target,
  Sparkles,
  Star,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  // Steps: 1=language, 2=study-path, 2.5=skill-gate, 3=test, 4=results
  const [step, setStep] = useState(1);
  const [preferredLanguage, setPreferredLanguage] = useState("bn");
  const [target, setTarget] = useState("IELTS");

  // Placement Test State
  const [vocabAnswer, setVocabAnswer] = useState("");
  const [readingAnswer, setReadingAnswer] = useState("");
  const [grammarAnswer, setGrammarAnswer] = useState("");
  const [writingAnswer, setWritingAnswer] = useState("");
  const [speakingAnswer, setSpeakingAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    cefrLevel: string;
    estimatedIeltsBand: number;
    skipped?: boolean;
  } | null>(null);

  const nativeLanguages = [
    { code: "bn", name: "বাংলা (Bangla)", flag: "🇧🇩" },
    { code: "ja", name: "日本語 (Japanese)", flag: "🇯🇵" },
    { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
    { code: "ar", name: "العربية (Arabic)", flag: "🇸🇦" },
    { code: "en", name: "English (English)", flag: "🇬🇧" },
  ];

  const targets = [
    { id: "IELTS", label: "IELTS Prep", desc: "Aimed at achieving 7.5+ Band score.", icon: "🎯" },
    { id: "TOEFL", label: "TOEFL Prep", desc: "Targeting academic university admission.", icon: "🎓" },
    { id: "GRE", label: "GRE Prep", desc: "Focusing on high-difficulty word banks.", icon: "📚" },
    { id: "General English", label: "General English", desc: "Enhancing daily conversations.", icon: "💬" },
    { id: "Business English", label: "Business English", desc: "Coaching professional correspondence.", icon: "💼" },
  ];

  const handleSkip = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await completeOnboardingAction({
        preferredLanguage,
        target,
        skipped: true,
      });
      if (res.success) {
        setResult({
          cefrLevel: res.cefrLevel || "B1",
          estimatedIeltsBand: res.estimatedIeltsBand || 5.5,
          skipped: true,
        });
        setStep(4);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!vocabAnswer || !readingAnswer || !grammarAnswer || !writingAnswer || !speakingAnswer) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await completeOnboardingAction({
        preferredLanguage,
        target,
        skipped: false,
        vocabularyAnswer: vocabAnswer,
        readingAnswer,
        grammarAnswer,
        writingAnswer,
        speakingAnswer,
      });
      if (res.success) {
        setResult({
          cefrLevel: res.cefrLevel || "B2",
          estimatedIeltsBand: res.estimatedIeltsBand || 6.5,
          skipped: false,
        });
        setStep(4);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step display label mapping
  const stepLabel = step <= 2 ? `Step ${step} of 2` : step === 2.5 ? "Almost there" : step === 3 ? "Placement Test" : "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pink-600/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-2xl w-full space-y-8 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-8 sm:p-10 backdrop-blur-xl relative">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500 animate-pulse" />
            <span className="font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              LinguaTrack AI
            </span>
          </div>
          {stepLabel && (
            <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
              {stepLabel}
            </span>
          )}
        </div>

        {/* Progress bar (steps 1-3) */}
        {step <= 3 && (
          <div className="flex gap-1.5">
            {[1, 2, 2.5, 3].map((s, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                  step >= s ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        )}

        {/* ===================== STEP 1: Language ===================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Globe className="h-3 w-3" /> Step 1 of 2
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Select your native language
              </h2>
              <p className="text-sm text-zinc-400">
                This sets your preferred translation engine for vocabulary definitions and sentence flashcards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nativeLanguages.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setPreferredLanguage(item.code)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${
                    preferredLanguage === item.code
                      ? "border-purple-500 bg-purple-950/20 text-white shadow-lg shadow-purple-500/10"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
                >
                  <span className="text-xl">{item.flag}</span>
                  <span className="text-sm font-semibold flex-1">{item.name}</span>
                  {preferredLanguage === item.code && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===================== STEP 2: Study Path ===================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Target className="h-3 w-3" /> Step 2 of 2
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Choose your study path
              </h2>
              <p className="text-sm text-zinc-400">
                Tell us about your learning goals so the recommendation engine targets relevant questions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {targets.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTarget(item.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    target === item.id
                      ? "border-purple-500 bg-purple-950/20 text-white shadow-lg shadow-purple-500/10"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{item.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                    target === item.id ? "border-purple-500 bg-purple-500" : "border-zinc-600"
                  }`}>
                    {target === item.id && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2.5)}
                className="w-2/3 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 2.5: SKILL GATE ===================== */}
        {step === 2.5 && (
          <div className="space-y-6">
            {/* Header Text */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/25">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Know Your Starting Point
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                A quick 5-question diagnostic helps our AI precisely calibrate your personalized study plan. Would you like to take it now?
              </p>
            </div>

            {/* Two Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Option A: Judge My Skills (Recommended) */}
              <button
                onClick={() => setStep(3)}
                className="group relative flex flex-col items-start p-6 rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-950/40 to-pink-950/20 hover:from-purple-950/60 hover:to-pink-950/40 text-left transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-400/70 hover:scale-[1.01]"
              >
                {/* Recommended badge */}
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white tracking-wide uppercase shadow-md">
                  Recommended
                </div>

                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                  <Brain className="h-5 w-5 text-purple-300" />
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                  Judge My Skills
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Take a 5-minute diagnostic test. Our AI will calculate your precise CEFR level and IELTS band, then tailor your entire study plan to your exact weaknesses.
                </p>

                {/* Feature list */}
                <div className="space-y-1.5 w-full">
                  {[
                    { icon: Star, text: "Precise CEFR level mapping" },
                    { icon: TrendingUp, text: "Personalized IELTS band estimate" },
                    { icon: Sparkles, text: "AI-targeted study plan" },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <feat.icon className="h-3 w-3 text-purple-400 flex-shrink-0" />
                      {feat.text}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-purple-300 group-hover:text-purple-200">
                  Start Test
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Option B: Skip */}
              <button
                onClick={handleSkip}
                disabled={loading}
                className="group relative flex flex-col items-start p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 text-left transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-4">
                  {loading ? (
                    <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
                  ) : (
                    <SkipForward className="h-5 w-5 text-zinc-400" />
                  )}
                </div>

                <h3 className="text-base font-bold text-zinc-200 mb-2">
                  Skip for Now
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Jump straight to the dashboard. We'll set your starting level at B1 (Band 5.5) and refine it as you complete practice sessions.
                </p>

                {/* Info list */}
                <div className="space-y-1.5 w-full">
                  {[
                    { icon: Clock, text: "Default level: B1 / Band 5.5" },
                    { icon: Shield, text: "Can take test later anytime" },
                    { icon: Zap, text: "Instant dashboard access" },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <feat.icon className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                      {feat.text}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-zinc-300">
                  {loading ? "Setting up..." : "Skip to Dashboard"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Back to Study Path
            </button>
          </div>
        )}

        {/* ===================== STEP 3: Placement Test ===================== */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Brain className="h-3 w-3 animate-pulse" /> Diagnostic Test — 5 Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Placement Diagnostics
              </h2>
              <p className="text-sm text-zinc-400">
                Answer all 5 questions honestly. Our AI analyses your responses to estimate your CEFR level and IELTS band.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">

              {/* Q1: Vocabulary */}
              <div className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">1</div>
                  <label className="text-sm font-bold text-zinc-200">Vocabulary</label>
                </div>
                <p className="text-xs text-zinc-400 pl-8">What is the closest synonym of <span className="text-white font-semibold">&ldquo;Resilient&rdquo;</span>?</p>
                <div className="grid grid-cols-2 gap-2 text-xs pl-8">
                  {["Flexible & adaptable", "Fragile & weak", "Rigid & stiff", "Unstable"].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setVocabAnswer(ans)}
                      className={`p-3 rounded-xl border text-left font-medium transition-all ${
                        vocabAnswer === ans
                          ? "border-purple-500 bg-purple-950/30 text-white shadow-md shadow-purple-500/10"
                          : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Reading */}
              <div className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">2</div>
                  <label className="text-sm font-bold text-zinc-200">Reading Comprehension</label>
                </div>
                <div className="ml-8 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-xs text-zinc-300 italic leading-relaxed">
                  &ldquo;The industrial revolution marked a period of rapid development, transforming agrarian societies into industrial ones, though it also introduced severe environmental and social issues.&rdquo;
                </div>
                <p className="text-xs text-zinc-400 pl-8">What was a negative effect of the industrial revolution according to the passage?</p>
                <input
                  type="text"
                  value={readingAnswer}
                  onChange={(e) => setReadingAnswer(e.target.value)}
                  placeholder="Your short answer..."
                  className="w-full ml-8 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                  style={{ width: "calc(100% - 2rem)" }}
                />
              </div>

              {/* Q3: Grammar */}
              <div className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">3</div>
                  <label className="text-sm font-bold text-zinc-200">Grammar Accuracy</label>
                </div>
                <p className="text-xs text-zinc-400 pl-8">Identify the grammatically correct sentence:</p>
                <div className="flex flex-col gap-2 text-xs pl-8">
                  {[
                    "She don't like coffee in the morning.",
                    "She doesn't like coffee in the morning.",
                    "She not like coffee in the morning.",
                  ].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setGrammarAnswer(ans)}
                      className={`p-3 rounded-xl border text-left font-medium transition-all ${
                        grammarAnswer === ans
                          ? "border-teal-500 bg-teal-950/20 text-white shadow-md shadow-teal-500/10"
                          : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Writing */}
              <div className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">4</div>
                  <label className="text-sm font-bold text-zinc-200">Writing Sample <span className="text-zinc-500 font-normal">(1–2 sentences)</span></label>
                </div>
                <p className="text-xs text-zinc-400 pl-8">Describe your personal goal for learning English:</p>
                <textarea
                  value={writingAnswer}
                  onChange={(e) => setWritingAnswer(e.target.value)}
                  rows={3}
                  placeholder="Type your learning goals in complete sentences..."
                  className="w-full p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Q5: Speaking/Expression */}
              <div className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">5</div>
                  <label className="text-sm font-bold text-zinc-200">Expression & Fluency</label>
                </div>
                <p className="text-xs text-zinc-400 pl-8">Briefly write about a time you had to adapt quickly to an unexpected change:</p>
                <textarea
                  value={speakingAnswer}
                  onChange={(e) => setSpeakingAnswer(e.target.value)}
                  rows={3}
                  placeholder="Describe your experience in a sentence or two..."
                  className="w-full p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2.5)}
                disabled={loading}
                className="w-1/3 py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating your level...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Submit for AI Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 4: Results ===================== */}
        {step === 4 && result && (
          <div className="space-y-6">
            {/* Celebration */}
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-50 animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <Award className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {result.skipped ? "You're All Set!" : "Your Level is Ready!"}
                </h2>
                <p className="text-sm text-zinc-400">
                  {result.skipped
                    ? "We've assigned a default starting level. Complete practice sessions to get a precise estimate."
                    : "Our AI has analysed your responses and mapped your current English proficiency."
                  }
                </p>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 text-center space-y-1">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">CEFR Level</span>
                <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
                  {result.cefrLevel}
                </span>
                <span className="block text-[10px] text-zinc-600 font-semibold">
                  {result.skipped ? "Default start" : "AI assessed"}
                </span>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 text-center space-y-1">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Est. IELTS Band</span>
                <span className="text-4xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent font-mono">
                  {result.estimatedIeltsBand}
                </span>
                <span className="block text-[10px] text-zinc-600 font-semibold">
                  {result.skipped ? "Provisional" : "Estimated"}
                </span>
              </div>
            </div>

            {/* Info message for skipped */}
            {result.skipped && (
              <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl">
                <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Your starting level has been set to <strong>B1 / Band 5.5</strong>. As you complete writing essays, speaking sessions, and reading passages, our AI will continuously update your estimated IELTS band in real time.
                </p>
              </div>
            )}

            <button
              onClick={() => router.push(`/${lang}/dashboard`)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm"
            >
              Enter Your Dashboard
              <Zap className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
