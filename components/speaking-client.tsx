"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Mic, Square, RefreshCw, Sparkles, Volume2, Award, FileText, Loader2 } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Left 2 Columns: Recorder & Prompts */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Prompt selector */}
        <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Speaking Prompts</span>
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
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[300px] backdrop-blur relative overflow-hidden">
          
          {/* Animated visualizer waves while recording */}
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-purple-500 rounded-full animate-pulse"
                  style={{ 
                    height: `${20 + Math.random() * 80}%`,
                    animationDuration: `${0.4 + Math.random() * 0.8}s` 
                  }} 
                />
              ))}
            </div>
          )}

          <div className="flex flex-col items-center space-y-2 relative">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              {isRecording ? "Recording Spoken Response" : "Speech Recorder"}
            </span>
            <span className="text-3xl font-black text-white font-mono">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Record / Stop Button */}
          <div className="flex items-center gap-4 relative">
            {!isRecording ? (
              <button
                onClick={handleStart}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/35 hover:scale-105"
                title="Start Recording"
              >
                <Mic className="h-6 w-6" />
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-16 h-16 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition-all shadow-lg hover:scale-105"
                title="Stop Recording"
              >
                <Square className="h-6 w-6 text-red-400" />
              </button>
            )}

            {/* Evaluate Trigger */}
            {audioBlob && !isRecording && (
              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Analyzing speech...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Submit Recording
                  </>
                )}
              </button>
            )}
          </div>

          {audioBlob && !isRecording && !result && (
            <p className="text-[10px] text-zinc-500 font-semibold italic">
              Audio recorded successfully! Click &ldquo;Submit Recording&rdquo; to analyze fluency and pronunciation.
            </p>
          )}
        </div>

        {/* Speech Transcript */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur">
            <h3 className="text-base font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              {dict.speaking.transcript}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap italic bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800">
              &ldquo;{result.transcript}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Right Column: AI Metrics & Feedback */}
      <div className="space-y-6">
        {result ? (
          <div className="space-y-6">
            
            {/* Core Metrics Card */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-6 backdrop-blur">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                Speech Analysis
              </h3>

              {/* Fluency / Pronunciation scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Fluency</span>
                  <span className="text-xl font-black text-purple-400 font-mono">
                    {result.evaluation.fluencyScore}%
                  </span>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Pronunciation</span>
                  <span className="text-xl font-black text-pink-400 font-mono">
                    {result.evaluation.pronunciationScore}%
                  </span>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Grammar accuracy</span>
                  <span className="text-xl font-black text-teal-400 font-mono">
                    {result.evaluation.grammarScore}%
                  </span>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Vocab variation</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {result.evaluation.vocabularyScore}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-1">
                  <span>Average IELTS speaking band estimation</span>
                  <span className="text-white">6.5 - 7.0</span>
                </div>
              </div>
            </div>

            {/* AI Detailed Feedback */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-6 space-y-4 backdrop-blur">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                {dict.speaking.feedback}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {result.evaluation.feedback}
              </p>
            </div>

          </div>
        ) : (
          /* Empty state */
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px] text-zinc-500 backdrop-blur">
            <Mic className="h-8 w-8 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-400">Analysis Pending</h3>
            <p className="text-xs text-zinc-500 max-w-[200px]">
              Record your speech and click submit to receive automated audio transcription and fluency scores.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
