"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { saveReadingAttemptAction } from "@/actions/practice";
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Play, BookOpen, Loader2 } from "lucide-react";
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
}

interface Passage {
  id: string;
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
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleSubmit = async () => {
    // Validate that all questions are answered
    if (Object.keys(answers).length < activePassage.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // Calculate scores
      let correctCount = 0;
      const questionResults: string[] = [];

      activePassage.questions.forEach((q) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctIndex;
        if (isCorrect) correctCount++;
        questionResults.push(
          `${q.topic}: ${isCorrect ? "Correct" : "Incorrect (Selected: " + q.options[selected] + ", Correct: " + q.options[q.correctIndex] + ")"}`
        );
      });

      const totalQuestions = activePassage.questions.length;
      const scoreValue = Math.round((correctCount / totalQuestions) * 100);
      const accuracyValue = scoreValue;

      // Speed WPM = total words / minutes elapsed
      const elapsedMinutes = timer / 60 || 0.1; // fallback to avoid division by zero
      const speedValue = Math.round(activePassage.wordCount / elapsedMinutes);

      // Simple algorithmic weakness analysis
      const missedTopics = activePassage.questions
        .filter((q) => answers[q.id] !== q.correctIndex)
        .map((q) => q.topic);
      
      const uniqueMissedTopics = Array.from(new Set(missedTopics));
      
      const aiFeedbackText = `Your reading speed is ${speedValue} WPM with an accuracy of ${accuracyValue}%. ` +
        (uniqueMissedTopics.length > 0 
          ? `We noticed difficulties with: ${uniqueMissedTopics.join(", ")}. Recommendation: Slow down on details retrieval and note paragraph topics.`
          : `Perfect score! Excellent detail retrieval and factual retention capacity. Focus on maintaining this speed.`);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Passages Selection */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Passages</h3>
        <div className="flex flex-col gap-2">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handlePassageSelect(idx)}
              className={`p-4 rounded-xl border text-left transition-all ${
                activePassageIndex === idx
                  ? "border-purple-500 bg-purple-950/20 text-white"
                  : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] text-zinc-500 font-mono">{p.wordCount} words</span>
              </div>
              <h4 className="text-xs font-bold line-clamp-1">{p.title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Passage & Questions */}
      <div className="lg:col-span-3 space-y-6">
        {!testStarted ? (
          /* Pre-test Screen */
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[400px] backdrop-blur">
            <h2 className="text-2xl font-extrabold text-white">{activePassage.title}</h2>
            <p className="text-xs text-zinc-400 max-w-md">
              This passage contains approximately {activePassage.wordCount} words and {activePassage.questions.length} questions. Click below to start the passage and begin the active timer.
            </p>
            <button
              onClick={() => setTestStarted(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              <Play className="h-4 w-4" />
              Start Reading Test
            </button>
          </div>
        ) : (
          /* Test Active / Result View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Passage text */}
            <div className="border border-zinc-800 bg-zinc-900/10 rounded-2xl p-6 space-y-4 backdrop-blur">
              <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-3">
                {activePassage.title}
              </h2>
              <p className="text-zinc-300 text-xs leading-relaxed select-none">
                {activePassage.text}
              </p>
            </div>

            {/* Right: Timer & Questions or Results */}
            <div className="space-y-6">
              
              {/* Active Timer Header */}
              <div className="flex items-center justify-between border border-zinc-800 bg-zinc-900/40 rounded-xl px-4 py-3 text-xs">
                <span className="text-zinc-500 font-semibold uppercase">{dict.reading.timer}</span>
                <div className="flex items-center gap-1.5 font-bold text-white font-mono">
                  <Clock className="h-4 w-4 text-purple-500" />
                  {formatTime(timer)}
                </div>
              </div>

              {!result ? (
                /* Interactive Questions */
                <div className="space-y-6">
                  {activePassage.questions.map((q, qIdx) => (
                    <div key={q.id} className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400">
                        Question {qIdx + 1} ({q.topic})
                      </h4>
                      <p className="text-sm text-zinc-100 font-medium">{q.text}</p>
                      
                      <div className="flex flex-col gap-2 pt-2 text-xs">
                        {q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              answers[q.id] === optIdx
                                ? "border-purple-500 bg-purple-950/20 text-white"
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
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? "Analyzing..." : dict.reading.submit}
                  </button>
                </div>
              ) : (
                /* Results card */
                <div className="border border-zinc-800 bg-purple-950/5 rounded-2xl p-6 space-y-6 backdrop-blur">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Diagnostics Results
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 text-center">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {result.accuracy}%
                      </span>
                    </div>
                    <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 text-center">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Speed (WPM)</span>
                      <span className="text-2xl font-black text-purple-400 font-mono">
                        {result.speed}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-xs font-bold text-purple-400">AI Evaluation Feedback</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {result.aiFeedback}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePassageSelect(activePassageIndex)}
                    className="w-full py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold rounded-xl transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
