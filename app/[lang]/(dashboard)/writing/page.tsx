import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { WritingClient } from "@/components";

const writingPrompts = [
  {
    id: "task2-education",
    taskType: 2,
    taskLabel: "Task 2 (Essay)",
    title: "University Education vs. Workplace Skills",
    description: "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.",
    targetWords: 250,
    timeLimitMinutes: 40,
    guidance: "Write at least 250 words. Give reasons for your answer and include relevant examples from your own knowledge or experience."
  },
  {
    id: "task1-academic",
    taskType: 1,
    taskLabel: "Task 1 (Academic Report)",
    title: "Global Energy Consumption Trends (2000–2025)",
    description: "The chart below shows energy consumption by fuel type (Renewables, Natural Gas, Petroleum, Coal) across five continents between 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    targetWords: 150,
    timeLimitMinutes: 20,
    guidance: "Write at least 150 words. Include an overview, key trends, and specific data points without personal opinions."
  },
  {
    id: "task2-remote-work",
    taskType: 2,
    taskLabel: "Task 2 (Essay)",
    title: "The Effects of Remote Work on Society",
    description: "In recent years, remote work has become widespread across many sectors. While some argue that working from home increases productivity and work-life balance, others believe it causes social isolation and weakens collaboration. Discuss both views and give your opinion.",
    targetWords: 250,
    timeLimitMinutes: 40,
    guidance: "Write at least 250 words. Support your arguments with logical transitions and academic vocabulary."
  },
  {
    id: "task1-general",
    taskType: 1,
    taskLabel: "Task 1 (General Letter)",
    title: "Letter of Complaint Regarding Public Facility Maintenance",
    description: "You recently noticed that a local public community library is in disrepair and has reduced its operating hours. Write a letter to the local municipal council describing the problems, explaining how this affects local residents, and suggesting specific actions.",
    targetWords: 150,
    timeLimitMinutes: 20,
    guidance: "Write at least 150 words. Use an appropriate formal tone and include all required points."
  }
];

export default async function WritingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {dict.writing.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {dict.writing.subtitle}
        </p>
      </div>

      <WritingClient prompts={writingPrompts} dict={dict} />
    </div>
  );
}

