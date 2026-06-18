"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { submitEssayAction } from "@/actions/practice";
import { PenTool, CheckCircle, Sparkles, BookOpen, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
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

  // Slices essayText to inject highlights inline
  const renderHighlightedEssay = (text: string, mistakes: Mistake[]) => {
    if (!mistakes || mistakes.length === 0) return <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{text}</p>;

    // Sort mistakes by startIndex to avoid overlap rendering issues
    const sortedMistakes = [...mistakes].sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMistakes.forEach((mistake, idx) => {
      // 1. Text before mistake
      if (mistake.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.slice(lastIndex, mistake.startIndex)}
          </span>
        );
      }

      // 2. Mistake highlight
      const errorWord = text.slice(mistake.startIndex, mistake.endIndex);
      elements.push(
        <button
          key={`err-${idx}`}
          onClick={() => setActiveMistake(mistake)}
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

    // 3. Trailing text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return (
      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
        {elements}
      </p>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Left 2 Columns: Input Essay */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Prompts list selector */}
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
            <span>Word Count: <strong className="text-zinc-300">{wordCount}</strong> words</span>
            <span className="italic">Recommended: 150+ words</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || wordCount < 5}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {dict.writing.analyzing}
              </>
            ) : (
              <>
                <PenTool className="h-4 w-4" />
                {dict.writing.submit}
              </>
            )}
          </button>
        </div>

        {/* Highlighted Mistake Display */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur">
            <h3 className="text-base font-bold text-zinc-200 border-b border-zinc-800 pb-3">
              Inline Grammar & Spelling Diagnostics
            </h3>
            <p className="text-xs text-zinc-400">
              Click on any highlighted word below to see correction suggestions and explanations.
            </p>
            <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800">
              {renderHighlightedEssay(essayText, result.mistakes)}
            </div>

            {/* Error inspector display */}
            {activeMistake && (
              <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/20 space-y-2 animate-fadeIn">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Suggestion Details
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-zinc-500 font-semibold block">Original:</span>
                    <span className="text-red-300 font-bold line-through">{activeMistake.originalText}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-semibold block">Correction:</span>
                    <span className="text-emerald-400 font-bold">{activeMistake.improvedText}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800/60">
                  <span className="text-zinc-500 font-semibold text-[10px] block">Explanation:</span>
                  <p className="text-zinc-300 text-xs leading-relaxed">{activeMistake.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: AI Metrics & Scores */}
      <div className="space-y-6">
        {result ? (
          <div className="space-y-6">
            
            {/* Core Metrics Card */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-6 backdrop-blur">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Score Summary
              </h3>

              <div className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-zinc-950/60 rounded-2xl text-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Estimated Band</span>
                <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono leading-none">
                  {result.estimatedBand.toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-500 mt-2 font-semibold">CEFR Equivalent Level: B2/C1</span>
              </div>

              {/* Individual skills mapping */}
              <div className="space-y-4">
                {[
                  { label: dict.writing.grammar, val: result.grammarScore, color: "bg-purple-500" },
                  { label: "Vocabulary Richness", val: result.vocabularyScore, color: "bg-pink-500" },
                  { label: "Coherence & Flow", val: result.coherenceScore, color: "bg-teal-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="text-zinc-200 font-semibold">{item.val}/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Improved Version */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-4 backdrop-blur">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {dict.writing.improvedVersion}
              </h3>
              <p className="text-zinc-300 text-xs leading-relaxed italic bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 select-all">
                &ldquo;{result.improvedVersion}&rdquo;
              </p>
            </div>

            {/* Writing Study Plan */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-4 backdrop-blur">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" />
                {dict.writing.studyPlan}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {result.studyPlan}
              </p>
            </div>

          </div>
        ) : (
          /* Empty state */
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px] text-zinc-500 backdrop-blur">
            <PenTool className="h-8 w-8 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-400">Analysis Pending</h3>
            <p className="text-xs text-zinc-500 max-w-[200px]">
              Write and submit your essay to receive comprehensive diagnostic scores and highlights.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
