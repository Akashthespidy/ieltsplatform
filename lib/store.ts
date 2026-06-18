import { atomWithStorage, createJSONStorage } from "jotai/utils";

const isClient = typeof window !== "undefined";

const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Safe local storage engine that guards against SSR window missing errors
const storage = createJSONStorage<any>(() => 
  isClient ? window.localStorage : mockStorage
);

// Vocabulary client persistent states
export const vocabActiveTabAtom = atomWithStorage<"suggested" | "review">(
  "vocab_active_tab", 
  "suggested", 
  storage
);
export const vocabCurrentIndexAtom = atomWithStorage<number>(
  "vocab_current_index", 
  0, 
  storage
);
export const vocabFlippedAtom = atomWithStorage<boolean>(
  "vocab_flipped", 
  false, 
  storage
);
export const vocabSelectedSuggestedWordIdAtom = atomWithStorage<string>(
  "vocab_selected_suggested_word_id", 
  "", 
  storage
);
export const vocabSearchQueryAtom = atomWithStorage<string>(
  "vocab_search_query", 
  "", 
  storage
);
export const vocabDisplayQueryAtom = atomWithStorage<string>(
  "vocab_display_query", 
  "", 
  storage
);
export const vocabAiExplanationAtom = atomWithStorage<string>(
  "vocab_ai_explanation", 
  "", 
  storage
);

// Reading client persistent states
export const readingActivePassageIndexAtom = atomWithStorage<number>(
  "reading_active_passage_index", 
  0, 
  storage
);
export const readingTestStartedAtom = atomWithStorage<boolean>(
  "reading_test_started", 
  false, 
  storage
);
export const readingTimerAtom = atomWithStorage<number>(
  "reading_timer", 
  0, 
  storage
);
export const readingAnswersAtom = atomWithStorage<Record<string, number>>(
  "reading_answers", 
  {}, 
  storage
);
export const readingResultAtom = atomWithStorage<{
  score: number;
  speed: number;
  accuracy: number;
  aiFeedback: string;
} | null>("reading_result", null, storage);

// Writing client persistent states
export const writingEssayTextAtom = atomWithStorage<string>(
  "writing_essay_text", 
  "", 
  storage
);
export const writingResultAtom = atomWithStorage<{
  success: boolean;
  attemptId: string;
  evaluation: any;
} | null>("writing_result", null, storage);

// Speaking client persistent states
export const speakingAudioBlobUrlAtom = atomWithStorage<string | null>(
  "speaking_audio_blob_url", 
  null, 
  storage
);
export const speakingTranscriptAtom = atomWithStorage<string>(
  "speaking_transcript", 
  "", 
  storage
);
export const speakingResultAtom = atomWithStorage<any | null>(
  "speaking_result", 
  null, 
  storage
);

// Listening client persistent states
export const listeningActiveTestIndexAtom = atomWithStorage<number>(
  "listening_active_test_index", 
  0, 
  storage
);
export const listeningPlaysRemainingAtom = atomWithStorage<number>(
  "listening_plays_remaining", 
  2, 
  storage
);
export const listeningAnswersAtom = atomWithStorage<Record<string, number>>(
  "listening_answers", 
  {}, 
  storage
);
export const listeningResultAtom = atomWithStorage<{
  score: number;
  feedback: string;
} | null>("listening_result", null, storage);
