"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { 
  users, 
  vocabularyProgress, 
  writingAttempts, 
  readingAttempts, 
  practiceSessions, 
  studyStreaks,
  wordBank
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { evaluateEssay, generateWordExplanation, generateWordDefinition } from "@/lib/open-ai";
import { checkDailyAiLimit } from "@/lib/limits";

// SM-2 Spaced Repetition Algorithm Helper
function calculateSM2(
  quality: number, // 0 to 5
  prevRepetitions: number,
  prevEaseFactor: number,
  prevInterval: number
) {
  let repetitions = prevRepetitions;
  let easeFactor = prevEaseFactor;
  let interval = prevInterval;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Adjust Ease Factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return {
    repetitions,
    easeFactor,
    interval,
  };
}

// Action to record spaced repetition vocabulary reviews
export async function reviewWordAction(progressId: string, quality: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const progressRecord = await db.query.vocabularyProgress.findFirst({
    where: eq(vocabularyProgress.id, progressId),
  });

  if (!progressRecord) {
    throw new Error("Vocabulary progress record not found");
  }

  const { repetitions, easeFactor, interval } = calculateSM2(
    quality,
    progressRecord.repetitions,
    progressRecord.easeFactor,
    progressRecord.interval
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  await db.update(vocabularyProgress).set({
    level: quality,
    repetitions,
    easeFactor,
    interval,
    nextReviewDate,
    lastReviewedDate: new Date(),
  }).where(eq(vocabularyProgress.id, progressId));

  // Log a practice session
  await db.insert(practiceSessions).values({
    userId: progressRecord.userId,
    type: "vocabulary",
    score: quality * 20, // quality 0-5 mapped to 0-100
    duration: 30, // estimation in seconds
  });

  // Increment study streak
  await updateStudyStreak(progressRecord.userId);

  return { success: true, nextReviewDate, interval };
}

// Action to fetch AI custom explanations
export async function getAIWordExplanationAction(word: string, contextSentence: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User not found");

  const limitCheck = await checkDailyAiLimit(userRecord.id);
  if (!limitCheck.allowed) {
    throw new Error(`Daily AI token limit reached (${limitCheck.limit}/${limitCheck.limit}). Please try again tomorrow.`);
  }

  const explanation = await generateWordExplanation(word, contextSentence);
  return { explanation };
}

export async function searchOrGenerateWordAction(searchWord: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  const normalized = searchWord.trim();
  if (!normalized) throw new Error("Search word cannot be empty");

  // 1. Check if word exists in our global wordBank
  let wordRecord = await db.query.wordBank.findFirst({
    where: eq(wordBank.word, normalized),
  });

  // If exact match fails, check case-insensitive match
  if (!wordRecord) {
    const allWords = await db.query.wordBank.findMany();
    wordRecord = allWords.find(w => w.word.toLowerCase() === normalized.toLowerCase());
  }

  // 2. If it does not exist, check AI limit and generate it via OpenAI
  if (!wordRecord) {
    const limitCheck = await checkDailyAiLimit(userRecord.id);
    if (!limitCheck.allowed) {
      throw new Error(`Daily AI token limit reached (${limitCheck.limit}/${limitCheck.limit}). Please try again tomorrow.`);
    }

    const aiDefinition = await generateWordDefinition(normalized);

    const inserted = await db.insert(wordBank).values({
      word: aiDefinition.word,
      ipa: aiDefinition.ipa,
      definition: aiDefinition.definition,
      translatedDefinitions: aiDefinition.translatedDefinitions,
      exampleSentence: aiDefinition.exampleSentence,
      translatedSentences: aiDefinition.translatedSentences,
      synonyms: aiDefinition.synonyms,
      antonyms: aiDefinition.antonyms,
      difficulty: aiDefinition.difficulty,
      usageFrequency: 0.5,
    }).returning();

    wordRecord = inserted[0];
  }

  // 3. Make sure it exists in user's vocabulary progress
  let progressRecord = await db.query.vocabularyProgress.findFirst({
    where: and(
      eq(vocabularyProgress.userId, userRecord.id),
      eq(vocabularyProgress.wordId, wordRecord.id)
    )
  });

  if (!progressRecord) {
    const insertedProg = await db.insert(vocabularyProgress).values({
      userId: userRecord.id,
      wordId: wordRecord.id,
      level: 0,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
    }).returning();
    progressRecord = insertedProg[0];
  }

  // Log as vocabulary practice session
  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "vocabulary",
    score: 100, // learning a new word
    duration: 15,
  });

  await updateStudyStreak(userRecord.id);

  // Map to frontend WordData schema matching language preferences
  const userPrefLang = userRecord.preferredLanguage || "en";
  const translatedDef = (wordRecord.translatedDefinitions as any)[userPrefLang] || wordRecord.definition;
  const translatedEx = (wordRecord.translatedSentences as any)[userPrefLang] || wordRecord.exampleSentence;

  return {
    progressId: progressRecord.id,
    word: wordRecord.word,
    ipa: wordRecord.ipa || "",
    englishDefinition: wordRecord.definition,
    translatedDefinition: translatedDef,
    englishExample: wordRecord.exampleSentence,
    translatedExample: translatedEx,
    synonyms: (wordRecord.synonyms as string[]) || [],
    antonyms: (wordRecord.antonyms as string[]) || [],
    difficulty: wordRecord.difficulty,
    nextReviewDate: progressRecord.nextReviewDate,
    isFavorite: progressRecord.isFavorite,
  };
}

// Action to submit essay for writing AI evaluation
export async function submitEssayAction(essayText: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User not found");

  const limitCheck = await checkDailyAiLimit(userRecord.id);
  if (!limitCheck.allowed) {
    throw new Error(`Daily AI token limit reached (${limitCheck.limit}/${limitCheck.limit}). Please try again tomorrow.`);
  }

  // Call OpenAI API for structured grading
  const aiResult = await evaluateEssay(essayText);

  // Record attempt
  const inserted = await db.insert(writingAttempts).values({
    userId: userRecord.id,
    essayText,
    grammarScore: aiResult.grammarScore,
    vocabularyScore: aiResult.vocabularyScore,
    coherenceScore: aiResult.coherenceScore,
    estimatedBand: aiResult.estimatedBand,
    mistakes: aiResult.mistakes,
    improvedVersion: aiResult.improvedVersion,
    studyPlan: aiResult.studyPlan,
  }).returning();

  // Log as a practice session
  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "writing",
    score: Math.round((aiResult.grammarScore + aiResult.vocabularyScore + aiResult.coherenceScore) / 3),
    duration: 600, // mock duration 10 mins
  });

  await updateStudyStreak(userRecord.id);

  return {
    success: true,
    attemptId: inserted[0].id,
    evaluation: aiResult,
  };
}

// Action to log reading attempts
export async function saveReadingAttemptAction(data: {
  passageId: string;
  answers: any;
  score: number;
  speed: number;
  accuracy: number;
  aiFeedback: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User not found");

  const inserted = await db.insert(readingAttempts).values({
    userId: userRecord.id,
    passageId: data.passageId,
    answers: data.answers,
    score: data.score,
    speed: data.speed,
    accuracy: data.accuracy,
    aiFeedback: data.aiFeedback,
  }).returning();

  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "reading",
    score: data.score,
    duration: 300,
  });

  await updateStudyStreak(userRecord.id);

  return { success: true, attemptId: inserted[0].id };
}

// Utility to increment study streak days
async function updateStudyStreak(userId: string) {
  const streak = await db.query.studyStreaks.findFirst({
    where: eq(studyStreaks.userId, userId),
  });

  const now = new Date();
  if (!streak) {
    await db.insert(studyStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: now,
    });
    return;
  }

  const lastActive = streak.lastActiveDate;
  if (!lastActive) {
    await db.update(studyStreaks).set({
      currentStreak: 1,
      lastActiveDate: now,
    }).where(eq(studyStreaks.userId, userId));
    return;
  }

  const diffTime = Math.abs(now.getTime() - lastActive.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    // Already studied today or consecutive day
    const isConsecutive = now.getDate() !== lastActive.getDate();
    const newStreak = isConsecutive ? streak.currentStreak + 1 : streak.currentStreak;
    const newLongest = Math.max(newStreak, streak.longestStreak);

    await db.update(studyStreaks).set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: now,
    }).where(eq(studyStreaks.userId, userId));
  } else {
    // Streak broken, restart
    await db.update(studyStreaks).set({
      currentStreak: 1,
      lastActiveDate: now,
    }).where(eq(studyStreaks.userId, userId));
  }
}
