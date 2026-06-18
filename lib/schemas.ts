import { z } from "zod";

export const completeOnboardingSchema = z.object({
  preferredLanguage: z.string().min(2).max(10),
  target: z.string().min(1, { message: "Target cannot be empty" }),
  vocabularyAnswer: z.string().min(1, { message: "Vocabulary answer is required" }),
  readingAnswer: z.string().min(1, { message: "Reading answer is required" }),
  grammarAnswer: z.string().min(1, { message: "Grammar answer is required" }),
  writingAnswer: z.string().min(1, { message: "Writing answer is required" }),
  speakingAnswer: z.string().min(1, { message: "Speaking answer is required" }),
});

export const reviewWordSchema = z.object({
  progressId: z.string().uuid({ message: "Invalid progress ID" }),
  quality: z.number().int().min(0).max(5, { message: "Quality must be between 0 and 5" }),
});

export const getAIWordExplanationSchema = z.object({
  word: z.string().min(1, { message: "Word cannot be empty" }),
  contextSentence: z.string().min(1, { message: "Context sentence cannot be empty" }),
});

export const searchOrGenerateWordSchema = z.object({
  searchWord: z.string().min(1, { message: "Search term cannot be empty" }),
});

export const submitEssaySchema = z.string().min(10, { message: "Essay must be at least 10 characters long" });

export const saveReadingAttemptSchema = z.object({
  passageId: z.string().min(1, { message: "Passage ID is required" }),
  answers: z.record(z.string(), z.number()),
  score: z.number().min(0).max(100),
  speed: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  aiFeedback: z.string().min(1),
});

export const markWordAsCompletedSchema = z.object({
  progressId: z.string().uuid({ message: "Invalid progress ID" }),
});

export const updateUserSettingsSchema = z.object({
  preferredLanguage: z.string().min(2).max(10),
  target: z.string().min(1, { message: "Target prep is required" }),
  timezone: z.string().min(1, { message: "Timezone is required" }),
  country: z.string().min(1, { message: "Country is required" }),
});
