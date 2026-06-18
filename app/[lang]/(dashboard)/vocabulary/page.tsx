import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, wordBank, vocabularyProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VocabularyClient } from "@/components";
import { getSuggestedVocabularyAction } from "@/actions/practice";

export default async function VocabularyPage({
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
  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!userRecord) {
    notFound();
  }

  // 2. Fetch vocabulary progress joined with wordBank for the card review deck
  let progressList = await db.query.vocabularyProgress.findMany({
    where: eq(vocabularyProgress.userId, userRecord.id),
    with: {
      word: true,
    },
  });

  // 3. Auto-populate progress list if empty, using seeded wordBank entries
  if (progressList.length === 0) {
    const allWords = await db.query.wordBank.findMany();
    if (allWords.length > 0) {
      const inserts = allWords.map((word) => ({
        userId: userRecord.id,
        wordId: word.id,
        level: 0,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
        isCompleted: false,
      }));

      await db.insert(vocabularyProgress).values(inserts);

      progressList = await db.query.vocabularyProgress.findMany({
        where: eq(vocabularyProgress.userId, userRecord.id),
        with: {
          word: true,
        },
      });
    }
  }

  // Deduplicate progressList by wordId to prevent duplicate key rendering errors on the client
  const seenWordIds = new Set<string>();
  progressList = progressList.filter((item) => {
    if (!item.word || seenWordIds.has(item.wordId)) {
      return false;
    }
    seenWordIds.add(item.wordId);
    return true;
  });

  // Map database entries to match frontend schema for overall word bank
  const mappedWords = progressList.map((item) => {
    // Find matching translation
    const userPrefLang = userRecord.preferredLanguage || "en";
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
    };
  });

  // Fetch the 100 suggested vocabulary words for target band range
  const suggestedData = await getSuggestedVocabularyAction();

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {dict.vocabulary.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {dict.vocabulary.subtitle}
        </p>
      </div>

      <VocabularyClient 
        words={mappedWords} 
        dict={dict} 
        preferredLang={userRecord.preferredLanguage} 
        suggestedWords={suggestedData.words}
        targetBandRange={suggestedData.targetBandRange}
      />
    </div>
  );
}
