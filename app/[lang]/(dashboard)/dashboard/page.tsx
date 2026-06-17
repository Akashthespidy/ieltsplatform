import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, studyStreaks, practiceSessions, recommendations } from "@/db/schema";
import { eq } from "drizzle-orm";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    notFound();
  }

  // 1. Fetch user profile
  let userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  // If user doesn't exist (e.g. bypassed onboarding during local testing), create a mock one
  if (!userRecord) {
    const inserted = await db.insert(users).values({
      clerkId,
      email: "learner@linguatrack.ai",
      name: "Smart Learner",
      preferredLanguage: "bn",
      learningLanguage: "en",
      completedOnboarding: true,
      estimatedIeltsBand: 6.5,
      cefrLevel: "B2",
    }).returning();
    userRecord = inserted[0];

    await db.insert(studyStreaks).values({
      userId: userRecord.id,
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: new Date(),
    });
  }

  // 2. Fetch study streaks
  const streak = await db.query.studyStreaks.findFirst({
    where: eq(studyStreaks.userId, userRecord.id),
  });

  // 3. Fetch recommendations
  const activeRec = await db.query.recommendations.findFirst({
    where: eq(recommendations.userId, userRecord.id),
    orderBy: (recommendations, { desc }) => [desc(recommendations.createdAt)],
  });

  // 4. Fetch practice sessions
  const sessions = await db.query.practiceSessions.findMany({
    where: eq(practiceSessions.userId, userRecord.id),
    orderBy: (practiceSessions, { desc }) => [desc(practiceSessions.createdAt)],
    limit: 10,
  });

  // Mock charts data if no real database history is accumulated yet
  const chartData = {
    weeklyPerformance: [
      { day: "Mon", score: 65 },
      { day: "Tue", score: 70 },
      { day: "Wed", score: 60 },
      { day: "Thu", score: 85 },
      { day: "Fri", score: 75 },
      { day: "Sat", score: 90 },
      { day: "Sun", score: sessions[0]?.score || 80 },
    ],
    skillStrengths: [
      { skill: "Reading", score: 85, fullMark: 100 },
      { skill: "Writing", score: 65, fullMark: 100 },
      { skill: "Speaking", score: 70, fullMark: 100 },
      { skill: "Grammar", score: 55, fullMark: 100 },
      { skill: "Listening", score: 90, fullMark: 100 },
    ],
    vocabGrowth: [
      { week: "Wk 1", count: 5 },
      { week: "Wk 2", count: 12 },
      { week: "Wk 3", count: 25 },
      { week: "Wk 4", count: 48 },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {dict.dashboard.welcome}, {userRecord.name || "Learner"}!
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Monitor your IELTS band improvements, review diagnostic radar summaries, and tackle weak areas.
        </p>
      </div>

      <DashboardClient 
        user={userRecord}
        streak={streak}
        recommendation={activeRec}
        chartData={chartData}
        dict={dict}
      />
    </div>
  );
}
