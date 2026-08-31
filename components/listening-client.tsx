"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { 
  Volume2, 
  Play, 
  Pause,
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Loader2,
  Sliders,
  Check,
  X,
  FileText,
  Sparkles,
  Award
} from "lucide-react";
import { saveListeningAttemptAction } from "@/actions/practice";
import {
  listeningActiveTestIndexAtom,
  listeningPlaysRemainingAtom,
  listeningAnswersAtom,
  listeningResultAtom
} from "@/lib/store";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface Test {
  id: string;
  sectionNumber?: number;
  sectionLabel?: string;
  title: string;
  audioPrompt: string;
  questions: Question[];
}

// Waveform visualizer bars for audio playback
function AudioWaveVisualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${active ? "bg-purple-400" : "bg-zinc-700"}`}
          style={{
            height: active ? `${25 + Math.sin(i * 0.9) * 20 + Math.random() * 40}%` : "20%",
          }}
        />
      ))}
    </div>
  );
}

export default function ListeningClient({
  tests,
  dict,
}: {
  tests: Test[];
  dict: any;
}) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTestIndex, setActiveTestIndex] = useAtom(listeningActiveTestIndexAtom);
  const activeTest = tests[activeTestIndex] || tests[0];

  // Listening states
  const [playsRemaining, setPlaysRemaining] = useAtom(listeningPlaysRemainingAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [answers, setAnswers] = useAtom(listeningAnswersAtom);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useAtom(listeningResultAtom);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTestIndex]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const handlePlayAudio = () => {
    if (isPlaying) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    if (playsRemaining <= 0) {
      alert("You have reached the maximum playback limit for this listening exercise.");
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeTest.audioPrompt);
      utterance.lang = "en-GB"; // Standard British English for IELTS
      utterance.rate = playbackSpeed;

      utterance.onstart = () => {
        setIsPlaying(true);
        setPlaysRemaining((prev) => {
          const val = typeof prev === "number" ? prev : 2;
          return Math.max(0, val - 1);
        });
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser. Showing transcript below.");
      setShowTranscript(true);
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < activeTest.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      let correctCount = 0;
      activeTest.questions.forEach((q) => {
        if (answers[q.id] === q.correctIndex) correctCount++;
      });

      const scoreValue = Math.round((correctCount / activeTest.questions.length) * 100);
      const feedbackText = scoreValue === 100
        ? "Perfect score! Excellent phonetic retention and detail extraction."
        : `You scored ${scoreValue}%. Review the transcript and listen for qualifying numbers, proper nouns, and specific adjectives.`;

      // Save to database
      await saveListeningAttemptAction({
        testId: activeTest.id,
        answers: answers as Record<string, number>,
        score: scoreValue,
        feedback: feedbackText,
      });

      setResult({
        score: scoreValue,
        feedback: feedbackText,
      });
    } catch (err) {
      console.error("Failed to save listening attempt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestSelect = (idx: number) => {
    setActiveTestIndex(idx);
    setPlaysRemaining(2);
    setAnswers({});
    setResult(null);
    setShowTranscript(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Test selection */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">IELTS Listening Sections</h3>
        <div className="flex flex-col gap-2">
          {tests.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => handleTestSelect(idx)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTestIndex === idx
                  ? "border-purple-500 bg-purple-950/30 text-white shadow-md shadow-purple-950/20"
                  : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  {t.sectionLabel ? t.sectionLabel.split(":")[0] : `Section ${idx + 1}`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{t.questions.length} Questions</span>
              </div>
              <h4 className="text-xs font-bold line-clamp-1 text-zinc-200">{t.title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Player & questions */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Visual Audio Player Dashboard */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur">
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                {activeTest.sectionLabel || "IELTS Listening Drill"}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight">{activeTest.title}</h2>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Listen carefully to the audio prompt. Simulating official exam rooms, replay chances are strictly limited.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <span className="text-purple-400 font-semibold">
                Replays remaining: <strong className="text-white font-mono">{playsRemaining}</strong>
              </span>

              {/* Speed controls */}
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                {[0.8, 1.0, 1.2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      playbackSpeed === spd
                        ? "bg-purple-600 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 shrink-0">
            <button
              onClick={handlePlayAudio}
              disabled={playsRemaining <= 0 && !isPlaying}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 shrink-0 ${
                isPlaying
                  ? "bg-purple-600 text-white ring-4 ring-purple-500/30 animate-pulse"
                  : playsRemaining <= 0
                  ? "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/30"
              }`}
              title={isPlaying ? "Pause Prompt" : "Play Prompt Audio"}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <AudioWaveVisualizer active={isPlaying} />
          </div>
        </div>

        {/* Questions & Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Question inputs */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Comprehension Questions</h3>
            
            {activeTest.questions.map((q, idx) => (
              <div key={q.id} className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Question {idx + 1}</span>
                <p className="text-sm text-zinc-100 font-medium">{q.text}</p>
                
                <div className="flex flex-col gap-2 text-xs pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === optIdx;
                    const isCorrect = optIdx === q.correctIndex;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          result
                            ? isCorrect
                              ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 font-bold"
                              : isSelected
                              ? "border-red-500 bg-red-950/20 text-red-300"
                              : "border-zinc-800 bg-zinc-900/10 text-zinc-500"
                            : isSelected
                            ? "border-purple-500 bg-purple-950/30 text-white font-bold"
                            : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span>{opt}</span>
                        {result && (
                          <span>
                            {isCorrect ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : isSelected ? (
                              <X className="h-4 w-4 text-red-400" />
                            ) : null}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation review accordion post-result */}
                {result && q.explanation && (
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 mt-2">
                    <strong className="text-purple-400">Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}

            {!result && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording Score...
                  </>
                ) : (
                  "Submit Answers"
                )}
              </button>
            )}
          </div>

          {/* Results side card */}
          <div className="space-y-6">
            {result ? (
              <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-6 backdrop-blur">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Performance Summary
                </h3>

                <div className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-zinc-950/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Listening Accuracy</span>
                  <span className="text-5xl font-black text-emerald-400 font-mono leading-none">
                    {result.score}%
                  </span>
                  <span className="text-xs text-zinc-500 mt-2 font-semibold">
                    {result.score >= 80 ? "Band 8.0 Level" : result.score >= 60 ? "Band 6.5 Level" : "Needs Review"}
                  </span>
                </div>

                <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-500/20 space-y-1">
                  <span className="text-xs font-bold text-purple-300">Listening Recommendation</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {result.feedback}
                  </p>
                </div>

                {/* View Transcript Accordion */}
                <div className="border border-zinc-800 bg-zinc-950/40 rounded-2xl p-4 space-y-2">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full flex items-center justify-between text-xs font-bold text-zinc-300"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-purple-400" />
                      {showTranscript ? "Hide Transcript" : "View Full Audio Transcript"}
                    </span>
                    <span className="text-[10px] text-zinc-500">{showTranscript ? "▲" : "▼"}</span>
                  </button>
                  {showTranscript && (
                    <p className="text-xs text-zinc-400 leading-relaxed pt-2 italic border-t border-zinc-800/60">
                      &ldquo;{activeTest.audioPrompt}&rdquo;
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleTestSelect(activeTestIndex)}
                  className="w-full py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset & Retry Exercise
                </button>
              </div>
            ) : (
              <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[260px] text-zinc-500 backdrop-blur">
                <AlertCircle className="h-8 w-8 text-zinc-700 animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-400">Scorecard Pending</h3>
                <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
                  Listen to the prompt and submit your answers to see instant accuracy diagnostics and transcript breakdowns.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

