"use client";

import React, { useState } from "react";
import { reviewWordAction, getAIWordExplanationAction, searchOrGenerateWordAction, markWordAsCompletedAction } from "@/actions/practice";
import { Sparkles, Star, Search, RefreshCw, Volume2, CheckCircle2, AlertCircle, Check, Loader2 } from "lucide-react";

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

interface SuggestedWord {
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
  isCompleted: boolean;
  band: number;
}

export default function VocabularyClient({
  words,
  dict,
  preferredLang,
  suggestedWords = [],
  targetBandRange = "5.5 - 7.5",
}: {
  words: WordData[];
  dict: any;
  preferredLang: string;
  suggestedWords?: SuggestedWord[];
  targetBandRange?: string;
}) {
  const [activeTab, setActiveTab] = useState<"suggested" | "review">("suggested");
  const [localWords, setLocalWords] = useState<WordData[]>(words);
  const [reviewList, setReviewList] = useState<WordData[]>(
    words.filter(w => new Date(w.nextReviewDate).getTime() <= Date.now() + 60000)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // Suggested Vocabulary States
  const [localSuggestedWords, setLocalSuggestedWords] = useState<SuggestedWord[]>(suggestedWords);
  const [selectedSuggestedWordId, setSelectedSuggestedWordId] = useState<string>("");
  const [markingProgressId, setMarkingProgressId] = useState<string>("");

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [displayQuery, setDisplayQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const activeWord = reviewList[currentIndex];

  // Determine active word for right panel:
  const activeRightWord = activeTab === "review"
    ? (flipped ? activeWord : null)
    : (localSuggestedWords.find(w => w.progressId === selectedSuggestedWordId) || 
       localSuggestedWords.find(w => !w.isCompleted) || 
       localSuggestedWords[0]);

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
    if (!activeRightWord) return;
    setAiLoading(true);
    setAiExplanation("");
    try {
      const res = await getAIWordExplanationAction(activeRightWord.word, activeRightWord.englishExample);
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

  const handleMarkAsCompleted = async (progressId: string) => {
    setMarkingProgressId(progressId);
    try {
      const res = await markWordAsCompletedAction(progressId);
      if (res.success) {
        setLocalSuggestedWords(prev =>
          prev.map(w => w.progressId === progressId ? { ...w, isCompleted: true } : w)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingProgressId("");
    }
  };

  const filteredAllWords = localWords.filter(
    (w) =>
      w.word.toLowerCase().includes(displayQuery.toLowerCase()) ||
      w.englishDefinition.toLowerCase().includes(displayQuery.toLowerCase())
  );

  // Visible Suggested words slicing
  const completedSuggested = localSuggestedWords.filter(w => w.isCompleted);
  const uncompletedSuggested = localSuggestedWords.filter(w => !w.isCompleted);
  const activeUncompletedSuggested = uncompletedSuggested.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Dynamic Tab Selectors */}
      <div className="flex flex-wrap gap-4 border-b border-zinc-800 pb-px">
        <button
          onClick={() => {
            setActiveTab("suggested");
            setAiExplanation("");
          }}
          className={`pb-4 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === "suggested"
              ? "border-purple-500 text-white font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          AI Suggested Vocabulary
          <span className="text-[10px] bg-purple-950/60 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
            Band {targetBandRange}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("review");
            setAiExplanation("");
          }}
          className={`pb-4 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === "review"
              ? "border-purple-500 text-white font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
          Flashcard Review Deck
          <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
            {reviewList.length} due
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Review deck OR Suggested study list */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "review" ? (
            activeWord ? (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Active Reviews ({reviewList.length > 0 ? currentIndex + 1 : 0} of {reviewList.length})
                </h3>

                {/* Flashcard container */}
                <div 
                  onClick={() => !flipped && setFlipped(true)}
                  className={`min-h-[340px] border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-500 backdrop-blur ${
                    flipped ? "ring-1 ring-purple-500/50" : "hover:border-zinc-700"
                  }`}
                >
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
              <div className="border border-zinc-800 bg-zinc-900/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[340px] backdrop-blur animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">All caught up!</h3>
                <p className="text-zinc-400 text-xs max-w-sm">
                  You have reviewed all due cards in your vocabulary bank for today.
                </p>
              </div>
            )
          ) : (
            /* AI Suggested Vocabulary Tab */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Active study queue (10 Words) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    Active Study Queue ({activeUncompletedSuggested.length} uncompleted words)
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-semibold italic">Total suggestions: 100</span>
                </div>

                {activeUncompletedSuggested.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {activeUncompletedSuggested.map((word) => {
                      const isSelected = selectedSuggestedWordId === word.progressId;
                      return (
                        <div
                          key={word.progressId}
                          onClick={() => setSelectedSuggestedWordId(word.progressId)}
                          className={`p-5 border rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col md:flex-row justify-between gap-4 backdrop-blur ${
                            isSelected
                              ? "bg-purple-950/10 border-purple-500/50 shadow-md shadow-purple-950/20"
                              : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-base leading-none">{word.word}</span>
                              <span className="font-mono text-zinc-500 text-xs">{word.ipa}</span>
                              <span className="text-[9px] bg-purple-950/60 border border-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded">
                                Band {word.band.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed pr-2">
                              {word.englishDefinition}
                            </p>
                            <p className="text-purple-400/90 text-xs font-medium">
                              {word.translatedDefinition}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTTS(word.word);
                              }}
                              className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all"
                              title="Listen to pronunciation"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsCompleted(word.progressId);
                              }}
                              disabled={markingProgressId === word.progressId}
                              className="px-4 py-2 border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                            >
                              {markingProgressId === word.progressId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Mark as Learned
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-zinc-800 bg-zinc-900/10 rounded-2xl p-12 text-center text-zinc-500 text-xs">
                    You have finished studying all active suggestions in this band range! Great job!
                  </div>
                )}
              </div>

              {/* Completed study list (Stays in the list as requested) */}
              {completedSuggested.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    Learned Words ({completedSuggested.length} words completed)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedSuggested.map((word) => {
                      const isSelected = selectedSuggestedWordId === word.progressId;
                      return (
                        <div
                          key={word.progressId}
                          onClick={() => setSelectedSuggestedWordId(word.progressId)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 relative flex flex-col justify-between gap-2 bg-zinc-900/10 border-zinc-800 hover:border-zinc-700 ${
                            isSelected ? "ring-1 ring-purple-500/30" : ""
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-400 line-through text-sm">{word.word}</span>
                                <span className="text-[9px] bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                                  Band {word.band.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-[9px] text-emerald-400/90 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Learned
                              </span>
                            </div>
                            <p className="text-zinc-500 text-xs leading-relaxed line-clamp-1">
                              {word.englishDefinition}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Search, Antonyms, Synonyms (3 Sites) */}
        <div className="space-y-6">
          {/* Site 1: Search & My Word Bank */}
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">My Word Bank</h3>
            
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
            {activeRightWord ? (
              activeRightWord.synonyms && activeRightWord.synonyms.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeRightWord.synonyms.map((syn) => (
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
                {activeTab === "review" ? "Reveal the active card to view synonyms." : "Select a suggested word."}
              </p>
            )}
          </div>

          {/* Site 3: Antonyms */}
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-3 backdrop-blur">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Antonyms</h3>
            {activeRightWord ? (
              activeRightWord.antonyms && activeRightWord.antonyms.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeRightWord.antonyms.map((ant) => (
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
                {activeTab === "review" ? "Reveal the active card to view antonyms." : "Select a suggested word."}
              </p>
            )}
          </div>

          {/* Optional: AI explanation for the selected suggested word */}
          {activeRightWord && (
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 space-y-4 backdrop-blur">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Active Word Nuance
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed italic bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
                &ldquo;{activeRightWord.englishExample}&rdquo;
              </p>
              {aiExplanation ? (
                <div className="text-xs text-zinc-300 leading-relaxed p-3 bg-purple-950/20 border border-purple-500/25 rounded-xl">
                  {aiExplanation}
                </div>
              ) : (
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading explanation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Ask AI about Context
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
