import { db } from "@/db";
import { practiceSessions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

const DAILY_LIMIT = 10;

export async function checkDailyAiLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sessions = await db.query.practiceSessions.findMany({
    where: and(
      eq(practiceSessions.userId, userId),
      gte(practiceSessions.createdAt, startOfDay)
    ),
  });

  // Count actions that consume OpenAI API tokens (writing, speaking, vocabulary explainer)
  const aiSessions = sessions.filter(
    (s) => s.type === "writing" || s.type === "speaking" || s.type === "vocabulary"
  );

  return {
    allowed: aiSessions.length < DAILY_LIMIT,
    count: aiSessions.length,
    limit: DAILY_LIMIT,
  };
}
