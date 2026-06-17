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
import { evaluateEssay, generateWordExplanation } from "@/lib/open-ai";

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
  const explanation = await generateWordExplanation(word, contextSentence);
  return { explanation };
}

// Action to submit essay for writing AI evaluation
export async function submitEssayAction(essayText: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User not found");

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
