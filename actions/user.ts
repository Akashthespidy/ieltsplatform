"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, studyStreaks, studyPlans, recommendations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluatePlacementTest } from "@/lib/open-ai";

export async function completeOnboardingAction(data: {
  preferredLanguage: string;
  target: string;
  vocabularyAnswer: string;
  readingAnswer: string;
  grammarAnswer: string;
  writingAnswer: string;
  speakingAnswer: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Unauthorized access");
  }

  // 1. Sync or retrieve user record
  let userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "user@example.com";
    const name = `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || "Learner";

    const inserted = await db.insert(users).values({
      clerkId,
      email,
      name,
      preferredLanguage: data.preferredLanguage,
      learningLanguage: "en",
      target: data.target,
      completedOnboarding: false,
    }).returning();

    userRecord = inserted[0];

    // Create a study streak starting record
    await db.insert(studyStreaks).values({
      userId: userRecord.id,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date(),
    }).onConflictDoNothing();
  }

  // 2. Grade the Placement Test using OpenAI API
  const aiResult = await evaluatePlacementTest({
    vocabulary: data.vocabularyAnswer,
    reading: data.readingAnswer,
    grammar: data.grammarAnswer,
    writing: data.writingAnswer,
    speaking: data.speakingAnswer,
  });

  // 3. Update User Onboarding status
  await db.update(users).set({
    preferredLanguage: data.preferredLanguage,
    target: data.target,
    completedOnboarding: true,
    estimatedIeltsBand: aiResult.estimatedIeltsBand,
    cefrLevel: aiResult.cefrLevel,
    updatedAt: new Date(),
  }).where(eq(users.id, userRecord.id));

  // 4. Seed dynamic recommendations and initial Study Plan
  await db.insert(recommendations).values({
    userId: userRecord.id,
    type: "daily_plan",
    data: {
      dailyRecommendation: aiResult.studyRecommendation,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
  });

  await db.insert(studyPlans).values({
    userId: userRecord.id,
    title: `Path to ${data.target}`,
    description: `Targeting weaknesses: ${aiResult.weaknesses.join(", ")}`,
    tasks: [
      { id: "1", label: "Complete 1 Grammar Practice Session", isCompleted: false },
      { id: "2", label: "Review 5 words in spaced repetition", isCompleted: false },
      { id: "3", label: "Submit 1 Essay Writing prompt", isCompleted: false },
    ],
    isCompleted: false,
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day goal
  });

  return {
    success: true,
    cefrLevel: aiResult.cefrLevel,
    estimatedIeltsBand: aiResult.estimatedIeltsBand,
  };
}

export async function getUserProfile() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  return userRecord || null;
}
