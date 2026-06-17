"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { completeOnboardingAction } from "@/actions/user";
import { Globe, BookOpen, Check, Loader2, Award, Zap, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

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
  const [result, setResult] = useState<{ cefrLevel: string; estimatedIeltsBand: number } | null>(null);

  const nativeLanguages = [
    { code: "bn", name: "বাংলা (Bangla)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "es", name: "Español (Spanish)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "en", name: "English (English)" },
  ];

  const targets = [
    { id: "IELTS", label: "IELTS Prep", desc: "Aimed at achieving 7.5+ Band score." },
    { id: "TOEFL", label: "TOEFL Prep", desc: "Targeting academic university admission." },
    { id: "GRE", label: "GRE Prep", desc: "Focusing on high-difficulty word banks." },
    { id: "General English", label: "General English", desc: "Enhancing daily conversations." },
    { id: "Business English", label: "Business English", desc: "Coaching professional correspondence." },
  ];

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
        });
        setStep(4);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-2xl w-full space-y-8 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-8 sm:p-10 backdrop-blur-xl relative">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500 animate-pulse" />
            <span className="font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              LinguaTrack AI Setup
            </span>
          </div>
          {step <= 3 && (
            <span className="text-xs font-semibold text-zinc-500">
              Step {step} of 3
            </span>
          )}
        </div>

        {/* STEP 1: Choose Native Translation Language */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Select your native language
              </h2>
              <p className="text-sm text-zinc-400">
                This sets your preferred translation engine for vocabulary definitions and sentence flashcards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nativeLanguages.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setPreferredLanguage(item.code)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    preferredLanguage === item.code
                      ? "border-purple-500 bg-purple-950/20 text-white"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.name}</span>
                  {preferredLanguage === item.code && (
                    <Check className="h-4 w-4 text-purple-500" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Choose target test prep */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Choose your study path
              </h2>
              <p className="text-sm text-zinc-400">
                Tell us about your learning goals so the recommendation engine targets relevant questions.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {targets.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTarget(item.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                    target === item.id
                      ? "border-purple-500 bg-purple-950/20 text-white"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      target === item.id ? "border-purple-500" : "border-zinc-600"
                    }`}>
                      {target === item.id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{item.label}</h4>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
              >
                Start Placement Test
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Placement Test */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Placement Diagnostics
              </h2>
              <p className="text-sm text-zinc-400">
                Complete these 5 evaluation questions. This initializes your base CEFR level.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Q1: Vocabulary */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200">
                  Question 1: Vocabulary
                </label>
                <p className="text-xs text-zinc-400">What is the synonym of the word &ldquo;Resilient&rdquo;?</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Flexible & adaptable", "Fragile & weak", "Rigid & stiff", "Unstable"].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setVocabAnswer(ans)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        vocabAnswer === ans
                          ? "border-purple-500 bg-purple-950/20 text-white"
                          : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Reading */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200">
                  Question 2: Reading
                </label>
                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs text-zinc-300 italic">
                  &ldquo;The industrial revolution marked a period of rapid development, transforming agrarian societies into industrial ones, though it also introduced severe environmental and social issues.&rdquo;
                </div>
                <p className="text-xs text-zinc-400">What was a negative effect of the industrial revolution according to the text?</p>
                <input
                  type="text"
                  value={readingAnswer}
                  onChange={(e) => setReadingAnswer(e.target.value)}
                  placeholder="Your short answer..."
                  className="w-full p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Q3: Grammar */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200">
                  Question 3: Grammar
                </label>
                <p className="text-xs text-zinc-400">Identify the grammatically correct sentence:</p>
                <div className="flex flex-col gap-2 text-xs">
                  {[
                    "She don't like coffee in the morning.",
                    "She doesn't like coffee in the morning.",
                    "She not like coffee in the morning."
                  ].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setGrammarAnswer(ans)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        grammarAnswer === ans
                          ? "border-purple-500 bg-purple-950/20 text-white"
                          : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Writing */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200">
                  Question 4: Writing Essay (1-2 sentences)
                </label>
                <p className="text-xs text-zinc-400">Describe your personal goal for learning English:</p>
                <textarea
                  value={writingAnswer}
                  onChange={(e) => setWritingAnswer(e.target.value)}
                  rows={3}
                  placeholder="Type your essay goals..."
                  className="w-full p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Q5: Speaking */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200">
                  Question 5: Speaking Description
                </label>
                <p className="text-xs text-zinc-400">Briefly write about a time you had to adapt quickly to change:</p>
                <textarea
                  value={speakingAnswer}
                  onChange={(e) => setSpeakingAnswer(e.target.value)}
                  rows={3}
                  placeholder="Describe your experience in a sentence or two..."
                  className="w-full p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-1/3 py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating level...
                  </>
                ) : (
                  "Submit Test"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Evaluation Results */}
        {step === 4 && result && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-4 mx-auto mb-4 text-white flex items-center justify-center animate-bounce">
              <Award className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Your Level is Ready!
              </h2>
              <p className="text-sm text-zinc-400">
                Our AI evaluation mapped your skills details below:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4">
                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">CEFR Level</span>
                <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
                  {result.cefrLevel}
                </span>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4">
                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Estimated Band</span>
                <span className="text-3xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent font-mono">
                  {result.estimatedIeltsBand}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                router.push(`/${lang}/dashboard`);
              }}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              Enter Dashboard
              <Zap className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
