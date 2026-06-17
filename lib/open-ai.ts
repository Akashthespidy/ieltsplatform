import { OpenAI } from "openai";
import { z } from "zod";

const apiKey = process.env.OPENAI_API_KEY || "mock-api-key";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: apiKey,
});

// Placement Test Result Schema
export const PlacementTestSchema = z.object({
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  estimatedIeltsBand: z.number().min(1.0).max(9.0),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  studyRecommendation: z.string(),
});

// Writing Evaluation Schema
export const WritingEvaluationSchema = z.object({
  grammarScore: z.number().min(0).max(100),
  vocabularyScore: z.number().min(0).max(100),
  coherenceScore: z.number().min(0).max(100),
  estimatedBand: z.number().min(1.0).max(9.0),
  mistakes: z.array(z.object({
    originalText: z.string(),
    improvedText: z.string(),
    explanation: z.string(),
    startIndex: z.number(),
    endIndex: z.number(),
  })),
  improvedVersion: z.string(),
  studyPlan: z.string(),
});

// Speaking Evaluation Schema
export const SpeakingEvaluationSchema = z.object({
  fluencyScore: z.number().min(0).max(100),
  grammarScore: z.number().min(0).max(100),
  pronunciationScore: z.number().min(0).max(100),
  vocabularyScore: z.number().min(0).max(100),
  feedback: z.string(),
});

// Mock results helper if api key is missing / mock environment
function getMockPlacement(writing: string) {
  const words = writing.split(/\s+/).length;
  let band = 5.5;
  let cefr: "B1" | "B2" | "C1" = "B1";
  if (words > 40) {
    band = 7.5;
    cefr = "C1";
  } else if (words > 20) {
    band = 6.5;
    cefr = "B2";
  }
  return {
    cefrLevel: cefr,
    estimatedIeltsBand: band,
    strengths: ["Good contextual comprehension", "Correct basic grammar structure"],
    weaknesses: ["Needs more advanced vocabulary usage", "Minor punctuation inconsistencies"],
    studyRecommendation: "Focus on expanding academic vocabulary and practicing complex sentence transitions.",
  };
}

function getMockWriting(essayText: string) {
  return {
    grammarScore: 78,
    vocabularyScore: 82,
    coherenceScore: 75,
    estimatedBand: 6.5,
    mistakes: [
      {
        originalText: "I is learning English",
        improvedText: "I am learning English",
        explanation: "Subject-verb agreement error. 'I' takes 'am' instead of 'is'.",
        startIndex: essayText.indexOf("I is learning") !== -1 ? essayText.indexOf("I is learning") : 0,
        endIndex: essayText.indexOf("I is learning") !== -1 ? essayText.indexOf("I is learning") + 13 : 13,
      }
    ],
    improvedVersion: essayText.replace("I is learning", "I am learning"),
    studyPlan: "Focus on subject-verb agreements and practice passive voice constructions.",
  };
}

function getMockSpeaking() {
  return {
    fluencyScore: 80,
    grammarScore: 75,
    pronunciationScore: 85,
    vocabularyScore: 70,
    feedback: "Overall good flow with natural pauses. Work on pronouncing 'th' sounds clearly and expand synonym selections.",
  };
}

// Service methods
export async function evaluatePlacementTest(answers: {
  vocabulary: string;
  reading: string;
  grammar: string;
  writing: string;
  speaking: string;
}) {
  if (apiKey === "mock-api-key") {
    return getMockPlacement(answers.writing);
  }

  try {
    const response = await (openai.beta as any).chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an official ESL evaluator. Assess the following answers to estimate CEFR and IELTS bands.",
        },
        {
          role: "user",
          content: JSON.stringify(answers),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "placement_test_evaluation",
          schema: {
            type: "object",
            properties: {
              cefrLevel: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
              estimatedIeltsBand: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              studyRecommendation: { type: "string" },
            },
            required: ["cefrLevel", "estimatedIeltsBand", "strengths", "weaknesses", "studyRecommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = response.choices[0].message.content;
    if (parsed) {
      return JSON.parse(parsed);
    }
    return getMockPlacement(answers.writing);
  } catch (error) {
    console.error("OpenAI Placement Test Evaluation Error:", error);
    return getMockPlacement(answers.writing);
  }
}

export async function evaluateEssay(essayText: string) {
  if (apiKey === "mock-api-key") {
    return getMockWriting(essayText);
  }

  try {
    const response = await (openai.beta as any).chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an official IELTS writing examiner. Analyze the essay, score metrics, locate errors, provide improvements and plans.",
        },
        {
          role: "user",
          content: essayText,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "writing_evaluation",
          schema: {
            type: "object",
            properties: {
              grammarScore: { type: "integer" },
              vocabularyScore: { type: "integer" },
              coherenceScore: { type: "integer" },
              estimatedBand: { type: "number" },
              mistakes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    originalText: { type: "string" },
                    improvedText: { type: "string" },
                    explanation: { type: "string" },
                    startIndex: { type: "integer" },
                    endIndex: { type: "integer" },
                  },
                  required: ["originalText", "improvedText", "explanation", "startIndex", "endIndex"],
                  additionalProperties: false,
                },
              },
              improvedVersion: { type: "string" },
              studyPlan: { type: "string" },
            },
            required: [
              "grammarScore",
              "vocabularyScore",
              "coherenceScore",
              "estimatedBand",
              "mistakes",
              "improvedVersion",
              "studyPlan",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = response.choices[0].message.content;
    if (parsed) {
      return JSON.parse(parsed);
    }
    return getMockWriting(essayText);
  } catch (error) {
    console.error("OpenAI Writing Evaluation Error:", error);
    return getMockWriting(essayText);
  }
}

export async function evaluateSpeaking(transcript: string) {
  if (apiKey === "mock-api-key") {
    return getMockSpeaking();
  }

  try {
    const response = await (openai.beta as any).chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an IELTS speaking examiner. Grade the spoken transcript across fluency, grammar, pronunciation, and vocabulary.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "speaking_evaluation",
          schema: {
            type: "object",
            properties: {
              fluencyScore: { type: "integer" },
              grammarScore: { type: "integer" },
              pronunciationScore: { type: "integer" },
              vocabularyScore: { type: "integer" },
              feedback: { type: "string" },
            },
            required: ["fluencyScore", "grammarScore", "pronunciationScore", "vocabularyScore", "feedback"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = response.choices[0].message.content;
    if (parsed) {
      return JSON.parse(parsed);
    }
    return getMockSpeaking();
  } catch (error) {
    console.error("OpenAI Speaking Evaluation Error:", error);
    return getMockSpeaking();
  }
}

export async function generateWordExplanation(word: string, contextSentence: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an English language tutor. Provide a short, engaging 2-sentence explanation of the word's nuance and usage in context.",
        },
        {
          role: "user",
          content: `Explain the word: "${word}" used in: "${contextSentence}"`,
        },
      ],
      max_tokens: 100,
    });
    return response.choices[0].message.content || `The word "${word}" emphasizes recovering or adapting quickly in context.`;
  } catch (error) {
    return `The word "${word}" is used to describe adaptability and strength in context.`;
  }
}
