"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateUserSettingsAction(data: {
  preferredLanguage: string;
  target: string;
  timezone: string;
  country: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User record not found");

  await db.update(users).set({
    preferredLanguage: data.preferredLanguage,
    target: data.target,
    timezone: data.timezone,
    country: data.country,
    updatedAt: new Date(),
  }).where(eq(users.id, userRecord.id));

  return { success: true };
}

export async function deleteUserAccountAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) throw new Error("User record not found");

  // Cascade deletes everything due to references cascade constraints
  await db.delete(users).where(eq(users.id, userRecord.id));

  return { success: true };
}

export async function exportUserDataAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    with: {
      practiceSessions: true,
      readingAttempts: true,
      writingAttempts: true,
      speakingAttempts: true,
      vocabularyProgress: true,
      studyPlans: true,
    },
  });

  if (!userRecord) throw new Error("User record not found");

  return {
    success: true,
    data: JSON.stringify(userRecord, null, 2),
  };
}
