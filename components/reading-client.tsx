"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { saveReadingAttemptAction } from "@/actions/practice";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  BookOpen, 
  Loader2,
  Type,
  Highlighter,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Award,
  Zap
} from "lucide-react";
import {
  readingActivePassageIndexAtom,
  readingTestStartedAtom,
  readingTimerAtom,
  readingAnswersAtom,
  readingResultAtom
} from "@/lib/store";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  topic: string;
  explanation?: string;
}

interface Passage {
  id: string;
  passageNumber?: number;
  title: string;
  text: string;
  wordCount: number;
  questions: Question[];
}

export default function ReadingClient({
  passages,
  dict,
}: {
  passages: Passage[];
  dict: any;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activePassageIndex, setActivePassageIndex] = useAtom(readingActivePassageIndexAtom);
  const activePassage = passages[activePassageIndex] || passages[0];

  // Test states
  const [testStarted, setTestStarted] = useAtom(readingTestStartedAtom);
  const [timer, setTimer] = useAtom(readingTimerAtom);
  const [answers, setAnswers] = useAtom(readingAnswersAtom);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useAtom(readingResultAtom);

  // UI preferences
  const [fontSize, setFontSize] = useState<"text-xs" | "text-sm" | "text-base">("text-sm");
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (testStarted && !result) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          const val = typeof prev === "number" ? prev : 0;
          return val + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [testStarted, result]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Restart settings when changing passage
  const handlePassageSelect = (idx: number) => {
    setActivePassageIndex(idx);
    setTestStarted(false);
    setTimer(0);
    setAnswers({});
    setResult(null);
    setHighlightedWords(new Set());
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleWordClick = (wordIdx: number) => {
    if (!highlightMode) return;
    setHighlightedWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordIdx)) next.delete(wordIdx);
      else next.add(wordIdx);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < activePassage.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      let correctCount = 0;
      const questionResults: string[] = [];

      activePassage.questions.forEach((q) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctIndex;
        if (isCorrect) correctCount++;
        questionResults.push(
          `${q.topic}: ${isCorrect ? "Correct" : "Incorrect"}`
        );
      });

      const totalQuestions = activePassage.questions.length;
      const scoreValue = Math.round((correctCount / totalQuestions) * 100);
      const accuracyValue = scoreValue;

      // Speed WPM = total words / minutes elapsed
      const elapsedMinutes = timer / 60 || 0.1;
      const speedValue = Math.round(activePassage.wordCount / elapsedMinutes);

      const missedTopics = activePassage.questions
        .filter((q) => answers[q.id] !== q.correctIndex)
        .map((q) => q.topic);
      
      const uniqueMissedTopics = Array.from(new Set(missedTopics));
      
      const aiFeedbackText = `Your reading speed is ${speedValue} WPM with an accuracy of ${accuracyValue}%. ` +
        (uniqueMissedTopics.length > 0 
          ? `We noticed difficulties with: ${uniqueMissedTopics.join(", ")}. Recommendation: Pay close attention to qualifying terminology and factual transitions.`
          : `Perfect score! Outstanding factual retention and speed.`);

      await saveReadingAttemptAction({
        passageId: activePassage.id,
        answers,
        score: scoreValue,
        speed: speedValue,
        accuracy: accuracyValue,
        aiFeedback: aiFeedbackText,
      });

      setResult({
        score: scoreValue,
        speed: speedValue,
        accuracy: accuracyValue,
        aiFeedback: aiFeedbackText,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const wordsInPassage = activePassage.text.split(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Passages Selection */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">IELTS Reading Passages</h3>
        <div className="flex flex-col gap-2">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handlePassageSelect(idx)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activePassageIndex === idx
                  ? "border-purple-500 bg-purple-950/30 text-white shadow-md shadow-purple-950/20"
                  : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  {p.passageNumber ? `Passage ${p.passageNumber}` : `Passage ${idx + 1}`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{p.wordCount} words</span>
              </div>
              <h4 className="text-xs font-bold line-clamp-1 text-zinc-200">{p.title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Passage & Questions */}
      <div className="lg:col-span-3 space-y-6">
        {!testStarted ? (
          /* Pre-test Screen */
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-5 min-h-[380px] backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                IELTS Academic Reading
              </span>
              <h2 className="text-2xl font-extrabold text-white">{activePassage.title}</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                This academic passage contains {activePassage.wordCount} words and {activePassage.questions.length} comprehension questions. Click below to start the passage and begin active time tracking.
              </p>
            </div>

            <button
              onClick={() => setTestStarted(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/25 hover:scale-105 text-sm"
            >
              <Play className="h-4 w-4" />
              Start Reading Test
            </button>
          </div>
        ) : (
          /* Test Active / Result View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Passage text with tools */}
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-sm font-bold text-white line-clamp-1">
                  {activePassage.title}
                </h2>
                
                {/* Passage Toolbar: Font size & Highlighter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightMode(!highlightMode)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                      highlightMode ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                    title={highlightMode ? "Highlighter ON (Click words)" : "Toggle Highlighter"}
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center border border-zinc-800 rounded-lg p-0.5 text-xs text-zinc-400">
                    <button
                      onClick={() => setFontSize("text-xs")}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${fontSize === "text-xs" ? "bg-zinc-800 text-white" : ""}`}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize("text-sm")}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${fontSize === "text-sm" ? "bg-zinc-800 text-white" : ""}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSize("text-base")}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${fontSize === "text-base" ? "bg-zinc-800 text-white" : ""}`}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>

              {/* Passage text with interactive highlighting */}
              <div className={`${fontSize} text-zinc-300 leading-relaxed max-h-[500px] overflow-y-auto pr-2 custom-scrollbar`}>
                {wordsInPassage.map((word, i) => (
                  <span
                    key={i}
                    onClick={() => handleWordClick(i)}
                    className={`transition-colors ${
                      highlightedWords.has(i)
                        ? "bg-amber-500/30 text-amber-200 px-0.5 rounded"
                        : highlightMode
                        ? "hover:bg-amber-500/20 cursor-pointer"
                        : ""
                    }`}
                  >
                    {word}{" "}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Timer & Questions or Results */}
            <div className="space-y-6">
              
              {/* Active Timer Header */}
              <div className="flex items-center justify-between border border-zinc-800 bg-zinc-900/40 rounded-2xl px-5 py-3.5 text-xs backdrop-blur">
                <span className="text-zinc-500 font-semibold uppercase">{dict.reading.timer || "Time Elapsed"}</span>
                <div className="flex items-center gap-1.5 font-bold text-white font-mono text-sm">
                  <Clock className="h-4 w-4 text-purple-400" />
                  {formatTime(timer)}
                </div>
              </div>

              {!result ? (
                /* Interactive Questions */
                <div className="space-y-5">
                  {activePassage.questions.map((q, qIdx) => (
                    <div key={q.id} className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Question {qIdx + 1}
                        </h4>
                        <span className="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/20">
                          {q.topic}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-100 font-medium">{q.text}</p>
                      
                      <div className="flex flex-col gap-2 pt-1 text-xs">
                        {q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              answers[q.id] === optIdx
                                ? "border-purple-500 bg-purple-950/30 text-white font-bold"
                                : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-purple-600/25"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing Speed & Accuracy...
                      </span>
                    ) : (
                      dict.reading.submit || "Submit for Evaluation"
                    )}
                  </button>
                </div>
              ) : (
                /* Results card & Question Review */
                <div className="space-y-6">
                  <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-6 backdrop-blur">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      Reading Diagnostics
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-4 text-center">
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</span>
                        <span className="text-3xl font-black text-emerald-400 font-mono">
                          {result.accuracy}%
                        </span>
                      </div>
                      <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-4 text-center">
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Speed (WPM)</span>
                        <span className="text-3xl font-black text-purple-400 font-mono">
                          {result.speed}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-500/20 space-y-1">
                      <span className="text-xs font-bold text-purple-300">AI Reading Evaluation</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {result.aiFeedback}
                      </p>
                    </div>

                    {/* Question Answers Review */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Question Explanations</span>
                      {activePassage.questions.map((q, idx) => {
                        const isCorrect = answers[q.id] === q.correctIndex;
                        return (
                          <div key={q.id} className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-300">Q{idx + 1}: {q.topic}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isCorrect ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" : "bg-red-950/40 border border-red-500/20 text-red-400"
                              }`}>
                                {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {isCorrect ? "Correct" : "Incorrect"}
                              </span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              {q.explanation || `Correct option: ${q.options[q.correctIndex]}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePassageSelect(activePassageIndex)}
                      className="w-full py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Passage Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

