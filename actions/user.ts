"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, studyStreaks, studyPlans, recommendations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluatePlacementTest } from "@/lib/open-ai";
import { completeOnboardingSchema } from "@/lib/schemas";

export async function completeOnboardingAction(data: {
  preferredLanguage: string;
  target: string;
  skipped?: boolean;
  vocabularyAnswer?: string;
  readingAnswer?: string;
  grammarAnswer?: string;
  writingAnswer?: string;
  speakingAnswer?: string;
}) {
  const validated = completeOnboardingSchema.parse(data);
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
      preferredLanguage: validated.preferredLanguage,
      learningLanguage: "en",
      target: validated.target,
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

  // 2. If skipped, use defaults; otherwise grade via OpenAI
  let aiResult: {
    cefrLevel: string;
    estimatedIeltsBand: number;
    studyRecommendation: string;
    strengths: string[];
    weaknesses: string[];
  };

  if (validated.skipped) {
    aiResult = {
      cefrLevel: "B1",
      estimatedIeltsBand: 5.5,
      studyRecommendation: `Welcome! Since you skipped the placement test, we've set your starting level at B1 (IELTS Band 5.5). Complete practice sessions to refine your personalized study plan. Focus on all four IELTS skills: Listening, Reading, Writing, and Speaking.`,
      strengths: ["Motivation to learn", "Self-directed learner"],
      weaknesses: ["Placement data pending — complete a test to get precise diagnostics"],
    };
  } else {
    aiResult = await evaluatePlacementTest({
      vocabulary: validated.vocabularyAnswer || "",
      reading: validated.readingAnswer || "",
      grammar: validated.grammarAnswer || "",
      writing: validated.writingAnswer || "",
      speaking: validated.speakingAnswer || "",
    });
  }

  // 3. Update User Onboarding status
  await db.update(users).set({
    preferredLanguage: validated.preferredLanguage,
    target: validated.target,
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
    title: `Path to ${validated.target}`,
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
    skipped: validated.skipped,
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
