"use client";

import React, { useState } from "react";
import { reviewWordAction, getAIWordExplanationAction, searchOrGenerateWordAction } from "@/actions/practice";
import { Sparkles, Star, Search, RefreshCw, Volume2, CheckCircle2, AlertCircle } from "lucide-react";

interface WordData {
  progressId: string;
  word: string;
  ipa: string;
  englishDefinition: string;
  translatedDefinition: string;
  englishExample: string;
  translatedExample: string;
  synonyms: string[];
  antonyms: string[];
  difficulty: string;
  nextReviewDate: Date;
  isFavorite: boolean;
}

export default function VocabularyClient({
  words,
  dict,
  preferredLang,
}: {
  words: WordData[];
  dict: any;
  preferredLang: string;
}) {
  const [localWords, setLocalWords] = useState<WordData[]>(words);
  const [reviewList, setReviewList] = useState<WordData[]>(
    words.filter(w => new Date(w.nextReviewDate).getTime() <= Date.now() + 60000)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [displayQuery, setDisplayQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const activeWord = reviewList[currentIndex];

  const handleGrade = async (quality: number) => {
    if (!activeWord) return;

    try {
      await reviewWordAction(activeWord.progressId, quality);
      
      // Move to next card or complete
      setFlipped(false);
      setAiExplanation("");
      
      if (currentIndex < reviewList.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Clear finished item
        setReviewList([]);
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskAI = async () => {
    if (!activeWord) return;
    setAiLoading(true);
    setAiExplanation("");
    try {
      const res = await getAIWordExplanationAction(activeWord.word, activeWord.englishExample);
      setAiExplanation(res.explanation);
    } catch (e) {
      setAiExplanation("AI was unable to retrieve a nuance context explanation at this moment.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) return;

    setSearching(true);
    setSearchError("");

    try {
      // 1. Check if word is already in our list (case-insensitive)
      const existing = localWords.find(w => w.word.toLowerCase() === term.toLowerCase());
      
      if (existing) {
        // Switch to the matched card immediately in the review deck if it's there
        const reviewIdx = reviewList.findIndex(w => w.word.toLowerCase() === term.toLowerCase());
        if (reviewIdx !== -1) {
          setCurrentIndex(reviewIdx);
          setFlipped(false);
        } else {
          // If not in the active review list, prepend it so the user can study it
          setReviewList(prev => [existing, ...prev]);
          setCurrentIndex(0);
          setFlipped(false);
        }
        setDisplayQuery(term);
        setSearching(false);
        return;
      }

      // 2. Call OpenAI Server Action to dynamically generate
      const generated = await searchOrGenerateWordAction(term);
      
      if (generated) {
        // Update local arrays
        setLocalWords(prev => [generated, ...prev]);
        setReviewList(prev => [generated, ...prev]);
        setCurrentIndex(0);
        setFlipped(false);
        setDisplayQuery(term);
      }
    } catch (e: any) {
      setSearchError(e.message || "Failed to search or generate word definition.");
    } finally {
      setSearching(false);
    }
  };

  const handleTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredAllWords = localWords.filter(
    (w) =>
      w.word.toLowerCase().includes(displayQuery.toLowerCase()) ||
      w.englishDefinition.toLowerCase().includes(displayQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Columns: Flashcard Area */}
      <div className="lg:col-span-2 space-y-6">
        {activeWord ? (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-zinc-300">
              Active Reviews ({reviewList.length > 0 ? currentIndex + 1 : 0} of {reviewList.length})
            </h3>

            {/* Flashcard container */}
            <div 
              onClick={() => !flipped && setFlipped(true)}
              className={`min-h-[340px] border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-500 backdrop-blur ${
                flipped ? "ring-1 ring-purple-500/50" : "hover:border-zinc-700"
              }`}
            >
              {/* Stars decoration */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
                  {activeWord.difficulty}
                </span>
                <Star className="h-4 w-4 text-zinc-600 hover:text-amber-500 transition-colors" />
              </div>

              {/* Front Side */}
              {!flipped ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {activeWord.word}
                  </h2>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="font-mono text-sm">{activeWord.ipa}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTTS(activeWord.word);
                      }}
                      className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-purple-400/80 animate-pulse mt-8">
                    Click card to reveal details
                  </span>
                </div>
              ) : (
                /* Back Side */
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {dict.vocabulary.definition}
                        </h4>
                        <p className="text-zinc-200 text-xs mt-1 leading-relaxed">
                          {activeWord.englishDefinition}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {dict.vocabulary.translation} ({preferredLang.toUpperCase()})
                        </h4>
                        <p className="text-purple-300 font-semibold text-sm mt-1">
                          {activeWord.translatedDefinition}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {dict.vocabulary.example}
                      </h4>
                      <p className="text-zinc-400 text-xs mt-0.5 italic">
                        &ldquo;{activeWord.englishExample}&rdquo;
                      </p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">
                        {activeWord.translatedExample}
                      </p>
                    </div>


                    {/* AI Nuance Box */}
                    {aiExplanation ? (
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-zinc-300 space-y-1">
                        <span className="font-bold text-purple-400 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          AI Nuance Context
                        </span>
                        <p className="leading-relaxed">{aiExplanation}</p>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskAI();
                        }}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 bg-purple-950/10 hover:bg-purple-950/30 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {aiLoading ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            {dict.vocabulary.explainLoading}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            {dict.vocabulary.explain}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* SM-2 grading actions */}
                  <div className="pt-4 border-t border-zinc-800 grid grid-cols-3 gap-2 sm:gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGrade(0);
                      }}
                      className="py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold transition-all text-center"
                    >
                      {dict.vocabulary.hard} (Retry)
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGrade(3);
                      }}
                      className="py-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 text-xs font-bold transition-all text-center"
                    >
                      {dict.vocabulary.medium}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGrade(5);
                      }}
                      className="py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 text-xs font-bold transition-all text-center"
                    >
                      {dict.vocabulary.easy}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Card review finished status */
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[340px] backdrop-blur">
            <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">All caught up!</h3>
            <p className="text-zinc-400 text-xs max-w-sm">
              You have reviewed all due cards in your vocabulary bank for today. We will notify you when new terms are ready for review.
            </p>
            {localWords.length > reviewList.length && (
              <button
                onClick={() => {
                  setReviewList(localWords);
                  setCurrentIndex(0);
                }}
                className="text-xs text-purple-400 font-semibold border border-purple-500/30 px-4 py-2 rounded-xl bg-purple-950/10 hover:bg-purple-950/20 transition-all mt-4"
              >
                Study All Words Anyway
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Search, Antonyms, Synonyms (3 Sites) */}
      <div className="space-y-6">
        {/* Site 1: Search & My Word Bank */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">My Word Bank</h3>
          
          {/* Search Error Banner */}
          {searchError && (
            <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-[11px] text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Search bar with Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or learn a new word..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-purple-500 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {searching ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {displayQuery && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Filtered by: &ldquo;{displayQuery}&rdquo;</span>
              <button 
                onClick={() => {
                  setDisplayQuery("");
                  setSearchQuery("");
                }}
                className="text-purple-400 font-bold hover:underline"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Word lists */}
          <div className="border border-zinc-800 rounded-2xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-zinc-800 custom-scrollbar bg-zinc-950/40">
            {filteredAllWords.length > 0 ? (
              filteredAllWords.map((word) => (
                <div key={word.word} className="p-3.5 hover:bg-zinc-900/30 transition-all space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{word.word}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{word.ipa}</span>
                  </div>
                  <p className="text-zinc-400 text-[10px] line-clamp-1">{word.englishDefinition}</p>
                  <div className="flex items-center justify-between text-[9px] pt-0.5">
                    <span className="text-purple-400">{word.translatedDefinition}</span>
                    <span className="text-zinc-600 uppercase font-semibold text-[8px]">{word.difficulty}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No matching words found.
              </div>
            )}
          </div>
        </div>

        {/* Site 2: Synonyms */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-3 backdrop-blur">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Synonyms</h3>
          {activeWord && flipped ? (
            activeWord.synonyms && activeWord.synonyms.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeWord.synonyms.map((syn) => (
                  <span key={syn} className="px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                    {syn}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs italic">No synonyms available for this word.</p>
            )
          ) : (
            <p className="text-zinc-500 text-xs italic">
              {activeWord ? "Reveal the active card to view synonyms." : "No active card."}
            </p>
          )}
        </div>

        {/* Site 3: Antonyms */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-3 backdrop-blur">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Antonyms</h3>
          {activeWord && flipped ? (
            activeWord.antonyms && activeWord.antonyms.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeWord.antonyms.map((ant) => (
                  <span key={ant} className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold">
                    {ant}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs italic">No antonyms available for this word.</p>
            )
          ) : (
            <p className="text-zinc-500 text-xs italic">
              {activeWord ? "Reveal the active card to view antonyms." : "No active card."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
