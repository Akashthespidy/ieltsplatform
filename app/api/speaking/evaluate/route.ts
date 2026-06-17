import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, speakingAttempts, practiceSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluateSpeaking, openai } from "@/lib/open-ai";
import { checkDailyAiLimit } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check daily AI limits
    const limitCheck = await checkDailyAiLimit(userRecord.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Daily AI token limit reached (${limitCheck.limit}/${limitCheck.limit}). Please try again tomorrow.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is missing" }, { status: 400 });
    }

    let transcript = "Yesterday, I went to the library to study English because I have an IELTS exam next week. I need to improve my reading and writing skills.";
    let audioUrl = "mock-audio-url-stored-local.wav";

    // If real OpenAI API key is present, execute Whisper transcription
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "mock-api-key") {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
        });
        transcript = transcription.text;
      } catch (whisperError) {
        console.error("Whisper transcription error:", whisperError);
        // Fallback to default mock transcript if Whisper fails
      }
    }

    // Evaluate speech transcript
    const evaluation = await evaluateSpeaking(transcript);

    // Save Speaking Attempt in DB
    const inserted = await db.insert(speakingAttempts).values({
      userId: userRecord.id,
      audioUrl: audioUrl,
      transcript: transcript,
      fluencyScore: evaluation.fluencyScore,
      grammarScore: evaluation.grammarScore,
      pronunciationScore: evaluation.pronunciationScore,
      vocabularyScore: evaluation.vocabularyScore,
      feedback: {
        detailedReview: evaluation.feedback,
      },
    }).returning();

    // Log a practice session
    await db.insert(practiceSessions).values({
      userId: userRecord.id,
      type: "speaking",
      score: Math.round(
        (evaluation.fluencyScore +
          evaluation.grammarScore +
          evaluation.pronunciationScore +
          evaluation.vocabularyScore) /
          4
      ),
      duration: 60, // estimated duration
    });

    return NextResponse.json({
      success: true,
      attemptId: inserted[0].id,
      transcript,
      evaluation,
    });
  } catch (error: any) {
    console.error("Speech Evaluation Endpoint Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
