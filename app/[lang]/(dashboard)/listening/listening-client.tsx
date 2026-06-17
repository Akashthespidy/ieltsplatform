"use client";

import React, { useState } from "react";
import { Volume2, Play, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

interface Test {
  id: string;
  title: string;
  audioPrompt: string;
  questions: Question[];
}

export default function ListeningClient({
  tests,
  dict,
}: {
  tests: Test[];
  dict: any;
}) {
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const activeTest = tests[activeTestIndex];

  // Listening states
  const [playsRemaining, setPlaysRemaining] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [result, setResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  const handlePlayAudio = () => {
    if (playsRemaining <= 0) {
      alert("You have reached the maximum playback limit for this listening exercise.");
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(activeTest.audioPrompt);
      utterance.lang = "en-US";
      utterance.rate = 0.9; // speak slightly slower for comprehension

      utterance.onstart = () => {
        setIsPlaying(true);
        setPlaysRemaining((prev) => prev - 1);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser. Showing transcripts.");
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (result) return; // disable modifying answers after submit
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < activeTest.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let correctCount = 0;
    activeTest.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correctCount++;
    });

    const scoreValue = Math.round((correctCount / activeTest.questions.length) * 100);
    const feedbackText = scoreValue === 100
      ? "Perfect score! Excellent phonetic absorption and factual focus."
      : `You scored ${scoreValue}%. Try listening again and paying close attention to specific percentage figures or key categories.`;

    setResult({
      score: scoreValue,
      feedback: feedbackText,
    });
  };

  const handleTestSelect = (idx: number) => {
    setActiveTestIndex(idx);
    setPlaysRemaining(2);
    setAnswers({});
    setResult(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Test selection */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Exercises</h3>
        <div className="flex flex-col gap-2">
          {tests.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => handleTestSelect(idx)}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeTestIndex === idx
                  ? "border-purple-500 bg-purple-950/20 text-white"
                  : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">Listening</span>
              </div>
              <h4 className="text-xs font-bold line-clamp-1">{t.title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Player & questions */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Visual Audio Player Dashboard */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-extrabold text-white">{activeTest.title}</h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Press the play button to listen to the prompt. Focus carefully as replay options are restricted to mock official test rooms.
            </p>
            <div className="pt-2 text-xs text-purple-400 font-semibold">
              Replays remaining: <strong className="text-white font-mono">{playsRemaining}</strong>
            </div>
          </div>

          <button
            onClick={handlePlayAudio}
            disabled={isPlaying || playsRemaining <= 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 shrink-0 ${
              isPlaying
                ? "bg-purple-600 animate-pulse text-white cursor-not-allowed"
                : playsRemaining <= 0
                ? "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/35"
            }`}
            title="Play Prompt Audio"
          >
            <Play className={`h-6 w-6 ${isPlaying ? "animate-spin" : ""}`} />
          </button>
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

            {!result && (
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
              >
                Submit Answers
              </button>
            )}
          </div>

          {/* Results side card */}
          <div className="space-y-6">
            {result ? (
              <div className="border border-zinc-800 bg-purple-950/5 rounded-3xl p-6 space-y-6 backdrop-blur">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Score Summary
                </h3>

                <div className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-zinc-950/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Score</span>
                  <span className="text-4xl font-black text-emerald-400 font-mono leading-none">
                    {result.score}%
                  </span>
                </div>

                <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-xs font-bold text-purple-400">Listening Recommendation</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {result.feedback}
                  </p>
                </div>

                <button
                  onClick={() => handleTestSelect(activeTestIndex)}
                  className="w-full py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Exercise
                </button>
              </div>
            ) : (
              <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[260px] text-zinc-500 backdrop-blur">
                <AlertCircle className="h-8 w-8 text-zinc-700 animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-400">Evaluation Pending</h3>
                <p className="text-xs text-zinc-500 max-w-[200px]">
                  Submit your comprehension answers to view grading results and targeted study advice.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
