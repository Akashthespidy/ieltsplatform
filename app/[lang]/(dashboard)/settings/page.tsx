import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsClient from "./settings-client";

export default async function SettingsPage({
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

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {dict.settings.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Customize your translations languages, manage theme states, and download/delete account details.
        </p>
      </div>

      <SettingsClient user={userRecord} dict={dict} />
    </div>
  );
}
