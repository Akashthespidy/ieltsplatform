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
  wordBank,
  studyPlans
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { evaluateEssay, generateWordExplanation, generateWordDefinition, generateAISuggestedWords } from "@/lib/open-ai";
import { checkDailyAiLimit } from "@/lib/limits";
import {
  reviewWordSchema,
  getAIWordExplanationSchema,
  searchOrGenerateWordSchema,
  submitEssaySchema,
  saveReadingAttemptSchema,
  markWordAsCompletedSchema,
  saveListeningAttemptSchema,
  toggleStudyTaskSchema,
  toggleFavoriteWordSchema
} from "@/lib/schemas";

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
  const validated = reviewWordSchema.parse({ progressId, quality });
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const progressRecord = await db.query.vocabularyProgress.findFirst({
    where: eq(vocabularyProgress.id, validated.progressId),
  });

  if (!progressRecord) {
    throw new Error("Vocabulary progress record not found");
  }

  const { repetitions, easeFactor, interval } = calculateSM2(
    validated.quality,
    progressRecord.repetitions,
    progressRecord.easeFactor,
    progressRecord.interval
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  await db.update(vocabularyProgress).set({
    level: validated.quality,
    repetitions,
    easeFactor,
    interval,
    nextReviewDate,
    lastReviewedDate: new Date(),
  }).where(eq(vocabularyProgress.id, validated.progressId));

  // Log a practice session
  await db.insert(practiceSessions).values({
    userId: progressRecord.userId,
    type: "vocabulary",
    score: validated.quality * 20, // quality 0-5 mapped to 0-100
    duration: 30, // estimation in seconds
  });

  // Increment study streak
  await updateStudyStreak(progressRecord.userId);

  return { success: true, nextReviewDate, interval };
}

// Action to fetch AI custom explanations
export async function getAIWordExplanationAction(word: string, contextSentence: string) {
  const validated = getAIWordExplanationSchema.parse({ word, contextSentence });
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

  const explanation = await generateWordExplanation(validated.word, validated.contextSentence);
  return { explanation };
}

export async function searchOrGenerateWordAction(searchWord: string) {
  const validated = searchOrGenerateWordSchema.parse({ searchWord });
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  const normalized = validated.searchWord.trim();
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
  const validatedEssayText = submitEssaySchema.parse(essayText);
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
  const aiResult = await evaluateEssay(validatedEssayText);

  // Record attempt
  const inserted = await db.insert(writingAttempts).values({
    userId: userRecord.id,
    essayText: validatedEssayText,
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
  const validated = saveReadingAttemptSchema.parse(data);
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User not found");

  const inserted = await db.insert(readingAttempts).values({
    userId: userRecord.id,
    passageId: validated.passageId,
    answers: validated.answers,
    score: validated.score,
    speed: validated.speed,
    accuracy: validated.accuracy,
    aiFeedback: validated.aiFeedback,
  }).returning();

  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "reading",
    score: validated.score,
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

export async function getSuggestedVocabularyAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  const userBand = userRecord.estimatedIeltsBand || 5.5;
  const minBand = userBand;
  const maxBand = userBand + 2.0;

  // 1. Fetch user's current vocabulary progress records
  let progressList = await db.query.vocabularyProgress.findMany({
    where: eq(vocabularyProgress.userId, userRecord.id),
    with: {
      word: true,
    },
  });

  // Deduplicate progressList by wordId to prevent duplicate key rendering errors on the client
  const seenWordIds = new Set<string>();
  progressList = progressList.filter(p => {
    if (!p.word || seenWordIds.has(p.wordId)) {
      return false;
    }
    seenWordIds.add(p.wordId);
    return true;
  });

  // Filter those in the band range
  let targetProgress = progressList.filter(p => {
    const wordBandValue = p.word.band;
    return wordBandValue !== null && wordBandValue >= minBand && wordBandValue <= maxBand;
  });

  const TARGET_SUGGESTED_POOL_SIZE = 25;

  // 2. If count is less than target size, try to pull more words from the database wordBank
  if (targetProgress.length < TARGET_SUGGESTED_POOL_SIZE) {
    const existingWordIds = progressList.map(p => p.wordId);
    
    // Find unassociated wordBank words in range [minBand, maxBand]
    const allDbWords = await db.query.wordBank.findMany();
    const availableDbWords = allDbWords.filter(w => {
      const b = w.band;
      return b !== null && b >= minBand && b <= maxBand && !existingWordIds.includes(w.id);
    });

    // Link available words up to target size
    const needed = TARGET_SUGGESTED_POOL_SIZE - targetProgress.length;
    const toLink = availableDbWords.slice(0, needed);
    
    if (toLink.length > 0) {
      const inserts = toLink.map(w => ({
        userId: userRecord.id,
        wordId: w.id,
        level: 0,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
        isCompleted: false,
      }));

      await db.insert(vocabularyProgress).values(inserts);

      // Re-fetch progress
      progressList = await db.query.vocabularyProgress.findMany({
        where: eq(vocabularyProgress.userId, userRecord.id),
        with: {
          word: true,
        },
      });

      // Deduplicate progressList
      const seenWordIdsRe = new Set<string>();
      progressList = progressList.filter(p => {
        if (!p.word || seenWordIdsRe.has(p.wordId)) {
          return false;
        }
        seenWordIdsRe.add(p.wordId);
        return true;
      });

      targetProgress = progressList.filter(p => {
        const wordBandValue = p.word.band;
        return wordBandValue !== null && wordBandValue >= minBand && wordBandValue <= maxBand;
      });
    }
  }

  // 3. If still less than target size, call OpenAI to dynamically generate more words!
  if (targetProgress.length < TARGET_SUGGESTED_POOL_SIZE) {
    const limitCheck = await checkDailyAiLimit(userRecord.id);
    if (limitCheck.allowed) {
      const excludeWords = progressList.map(p => p.word.word.toLowerCase());
      try {
        const aiSuggested = await generateAISuggestedWords(userBand, excludeWords);
        
        if (aiSuggested && aiSuggested.words && aiSuggested.words.length > 0) {
          const insertedWords = [];
          for (const item of aiSuggested.words) {
            // Check if word already exists in global bank
            let existing = await db.query.wordBank.findFirst({
              where: eq(wordBank.word, item.word),
            });
            if (!existing) {
              const inserted = await db.insert(wordBank).values({
                word: item.word,
                ipa: item.ipa,
                definition: item.definition,
                translatedDefinitions: item.translatedDefinitions || {},
                exampleSentence: item.exampleSentence,
                translatedSentences: item.translatedSentences || {},
                synonyms: item.synonyms || [],
                antonyms: item.antonyms || [],
                difficulty: item.difficulty || "medium",
                band: item.band,
              }).returning();
              existing = inserted[0];
            }
            insertedWords.push(existing);
          }

          // Link new words to user progress, preventing duplicate entries
          const existingWordIds = progressList.map(p => p.wordId);
          const toLink = insertedWords.filter(w => !existingWordIds.includes(w.id));

          if (toLink.length > 0) {
            const inserts = toLink.map(w => ({
              userId: userRecord.id,
              wordId: w.id,
              level: 0,
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewDate: new Date(),
              isCompleted: false,
            }));

            await db.insert(vocabularyProgress).values(inserts);
          }

          // Re-fetch progress one final time
          progressList = await db.query.vocabularyProgress.findMany({
            where: eq(vocabularyProgress.userId, userRecord.id),
            with: {
              word: true,
            },
          });

          // Deduplicate progressList
          const seenWordIdsFinal = new Set<string>();
          progressList = progressList.filter(p => {
            if (!p.word || seenWordIdsFinal.has(p.wordId)) {
              return false;
            }
            seenWordIdsFinal.add(p.wordId);
            return true;
          });

          targetProgress = progressList.filter(p => {
            const wordBandValue = p.word.band;
            return wordBandValue !== null && wordBandValue >= minBand && wordBandValue <= maxBand;
          });
        }
      } catch (err) {
        console.error("Failed to generate AI vocabulary suggestions on page load:", err);
      }
    }
  }

  // Map progress items to frontend format
  const userPrefLang = userRecord.preferredLanguage || "en";
  const mapped = targetProgress.map(item => {
    const translatedDef = (item.word.translatedDefinitions as any)[userPrefLang] || item.word.definition;
    const translatedEx = (item.word.translatedSentences as any)[userPrefLang] || item.word.exampleSentence;
    return {
      progressId: item.id,
      word: item.word.word,
      ipa: item.word.ipa || "",
      englishDefinition: item.word.definition,
      translatedDefinition: translatedDef,
      englishExample: item.word.exampleSentence,
      translatedExample: translatedEx,
      synonyms: (item.word.synonyms as string[]) || [],
      antonyms: (item.word.antonyms as string[]) || [],
      difficulty: item.word.difficulty,
      nextReviewDate: item.nextReviewDate,
      isFavorite: item.isFavorite,
      isCompleted: item.isCompleted,
      band: item.word.band || userBand,
    };
  });

  return {
    words: mapped,
    targetBandRange: `${minBand.toFixed(1)} - ${maxBand.toFixed(1)}`,
  };
}

export async function markWordAsCompletedAction(progressId: string) {
  const validated = markWordAsCompletedSchema.parse({ progressId });
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  // Update progress
  await db.update(vocabularyProgress).set({
    isCompleted: true,
  }).where(eq(vocabularyProgress.id, validated.progressId));

  // Log practice session
  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "vocabulary",
    score: 100, // completed word
    duration: 30,
  });

  await updateStudyStreak(userRecord.id);

  return { success: true };
}

// Action to save Listening Attempt
export async function saveListeningAttemptAction(data: {
  testId: string;
  answers: Record<string, number>;
  score: number;
  feedback: string;
}) {
  const validated = saveListeningAttemptSchema.parse(data);
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  // Log as practice session
  await db.insert(practiceSessions).values({
    userId: userRecord.id,
    type: "listening",
    score: validated.score,
    duration: 180,
  });

  await updateStudyStreak(userRecord.id);

  return { success: true };
}

// Action to toggle study plan task completion status
export async function toggleStudyTaskAction(planId: string, taskId: string, isCompleted: boolean) {
  const validated = toggleStudyTaskSchema.parse({ planId, taskId, isCompleted });
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  const plan = await db.query.studyPlans.findFirst({
    where: and(
      eq(studyPlans.id, validated.planId),
      eq(studyPlans.userId, userRecord.id)
    ),
  });

  if (!plan) throw new Error("Study plan not found");

  const currentTasks = (plan.tasks as Array<{ id: string; label: string; isCompleted: boolean }>) || [];
  const updatedTasks = currentTasks.map(t =>
    t.id === validated.taskId ? { ...t, isCompleted: validated.isCompleted } : t
  );

  const allCompleted = updatedTasks.every(t => t.isCompleted);

  await db.update(studyPlans).set({
    tasks: updatedTasks,
    isCompleted: allCompleted,
  }).where(eq(studyPlans.id, validated.planId));

  return { success: true, tasks: updatedTasks, isCompleted: allCompleted };
}

// Action to toggle favorite / bookmark on vocabulary progress word
export async function toggleFavoriteWordAction(progressId: string, isFavorite: boolean) {
  const validated = toggleFavoriteWordSchema.parse({ progressId, isFavorite });
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!userRecord) throw new Error("User not found");

  await db.update(vocabularyProgress).set({
    isFavorite: validated.isFavorite,
  }).where(
    and(
      eq(vocabularyProgress.id, validated.progressId),
      eq(vocabularyProgress.userId, userRecord.id)
    )
  );

  return { success: true, isFavorite: validated.isFavorite };
}


