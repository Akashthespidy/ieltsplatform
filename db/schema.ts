import { 
  pgTable, 
  uuid, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  real, 
  jsonb, 
  pgEnum 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const practiceTypeEnum = pgEnum("practice_type", [
  "reading", "writing", "speaking", "grammar", "listening", "vocabulary"
]);

export const recommendationTypeEnum = pgEnum("recommendation_type", [
  "daily_plan", "weak_area", "feedback"
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  learningLanguage: text("learning_language").default("en").notNull(),
  target: text("target"), // "IELTS", "TOEFL", "GRE", "General English", "Business English"
  timezone: text("timezone").default("UTC").notNull(),
  country: text("country"),
  completedOnboarding: boolean("completed_onboarding").default(false).notNull(),
  estimatedIeltsBand: real("estimated_ielts_band"),
  cefrLevel: text("cefr_level"), // "A1", "A2", "B1", "B2", "C1", "C2"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Practice Sessions table
export const practiceSessions = pgTable("practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: practiceTypeEnum("type").notNull(),
  score: integer("score"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reading Attempts table
export const readingAttempts = pgTable("reading_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  passageId: text("passage_id").notNull(),
  answers: jsonb("answers").notNull(), // user's selected answers
  score: integer("score").notNull(),
  speed: integer("speed").notNull(), // WPM
  accuracy: integer("accuracy").notNull(), // percentage
  aiFeedback: text("ai_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Writing Attempts table
export const writingAttempts = pgTable("writing_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  essayText: text("essay_text").notNull(),
  grammarScore: integer("grammar_score").notNull(),
  vocabularyScore: integer("vocabulary_score").notNull(),
  coherenceScore: integer("coherence_score").notNull(),
  estimatedBand: real("estimated_band").notNull(),
  mistakes: jsonb("mistakes").notNull(), // offset-based highlighted grammar/spelling errors
  improvedVersion: text("improved_version").notNull(),
  studyPlan: text("study_plan").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Speaking Attempts table
export const speakingAttempts = pgTable("speaking_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  audioUrl: text("audio_url").notNull(),
  transcript: text("transcript").notNull(),
  fluencyScore: integer("fluency_score").notNull(),
  grammarScore: integer("grammar_score").notNull(),
  pronunciationScore: integer("pronunciation_score").notNull(),
  vocabularyScore: integer("vocabulary_score").notNull(),
  feedback: jsonb("feedback").notNull(), // detailed OpenAI pronunciation/fluency feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Grammar Attempts table
export const grammarAttempts = pgTable("grammar_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  details: jsonb("details").notNull(), // dynamic questions answered correct/incorrect
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Word Bank table
export const wordBank = pgTable("word_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  word: text("word").notNull().unique(),
  ipa: text("ipa"),
  definition: text("definition").notNull(),
  translatedDefinitions: jsonb("translated_definitions").notNull(), // e.g. { "bn": "সহনশীল", "ja": "回復力のある" }
  exampleSentence: text("example_sentence").notNull(),
  translatedSentences: jsonb("translated_sentences").notNull(), // e.g. { "bn": "...", "ja": "..." }
  synonyms: jsonb("synonyms").notNull(), // string[]
  antonyms: jsonb("antonyms").notNull(), // string[]
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  usageFrequency: real("usage_frequency"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vocabulary Progress table (Spaced Repetition tracking)
export const vocabularyProgress = pgTable("vocabulary_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  wordId: uuid("word_id").references(() => wordBank.id, { onDelete: "cascade" }).notNull(),
  level: integer("level").default(0).notNull(), // SuperMemo interval status level (0-6)
  easeFactor: real("ease_factor").default(2.5).notNull(), // SuperMemo ease factor (default 2.5)
  interval: integer("interval").default(0).notNull(), // review interval in days
  repetitions: integer("repetitions").default(0).notNull(), // count of repetitions
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  lastReviewedDate: timestamp("last_reviewed_date"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recommendations table (Daily plans, weak areas, personalized feedbacks)
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: recommendationTypeEnum("type").notNull(),
  data: jsonb("data").notNull(), // structured feedback details
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Study Streaks table
export const studyStreaks = pgTable("study_streaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics table (Weekly/monthly summaries)
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  dailyScore: integer("daily_score").default(0).notNull(),
  weeklyScore: integer("weekly_score").default(0).notNull(),
  monthlyScore: integer("monthly_score").default(0).notNull(),
  vocabularyGrowth: integer("vocabulary_growth").default(0).notNull(),
  estimatedBand: real("estimated_band"),
  trend: text("trend"), // "improving", "decline", "stable"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Study Plans table
export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tasks: jsonb("tasks").notNull(), // array of tasks: { id: string, label: string, isCompleted: boolean }
  isCompleted: boolean("is_completed").default(false).notNull(),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(), // "info", "warning", "success"
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  studyStreak: one(studyStreaks, {
    fields: [users.id],
    references: [studyStreaks.userId],
  }),
  practiceSessions: many(practiceSessions),
  readingAttempts: many(readingAttempts),
  writingAttempts: many(writingAttempts),
  speakingAttempts: many(speakingAttempts),
  grammarAttempts: many(grammarAttempts),
  vocabularyProgress: many(vocabularyProgress),
  recommendations: many(recommendations),
  analytics: many(analytics),
  studyPlans: many(studyPlans),
  notifications: many(notifications),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({ one }) => ({
  user: one(users, {
    fields: [practiceSessions.userId],
    references: [users.id],
  }),
}));

export const readingAttemptsRelations = relations(readingAttempts, ({ one }) => ({
  user: one(users, {
    fields: [readingAttempts.userId],
    references: [users.id],
  }),
}));

export const writingAttemptsRelations = relations(writingAttempts, ({ one }) => ({
  user: one(users, {
    fields: [writingAttempts.userId],
    references: [users.id],
  }),
}));

export const speakingAttemptsRelations = relations(speakingAttempts, ({ one }) => ({
  user: one(users, {
    fields: [speakingAttempts.userId],
    references: [users.id],
  }),
}));

export const grammarAttemptsRelations = relations(grammarAttempts, ({ one }) => ({
  user: one(users, {
    fields: [grammarAttempts.userId],
    references: [users.id],
  }),
}));

export const wordBankRelations = relations(wordBank, ({ many }) => ({
  vocabularyProgress: many(vocabularyProgress),
}));

export const vocabularyProgressRelations = relations(vocabularyProgress, ({ one }) => ({
  user: one(users, {
    fields: [vocabularyProgress.userId],
    references: [users.id],
  }),
  word: one(wordBank, {
    fields: [vocabularyProgress.wordId],
    references: [wordBank.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, {
    fields: [recommendations.userId],
    references: [users.id],
  }),
}));

export const studyStreaksRelations = relations(studyStreaks, ({ one }) => ({
  user: one(users, {
    fields: [studyStreaks.userId],
    references: [users.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, {
    fields: [analytics.userId],
    references: [users.id],
  }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
