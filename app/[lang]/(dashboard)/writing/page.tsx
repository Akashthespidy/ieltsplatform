import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { WritingClient } from "@/components";

const writingPrompts = [
  {
    id: "prompt-1",
    title: "University Education vs. Vocational Training",
    description: "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion."
  },
  {
    id: "prompt-2",
    title: "The Effects of Remote Work",
    description: "In recent years, remote work has become highly prevalent in many industries. While some argue that working from home increases productivity and work-life balance, others believe it causes isolation and lowers team collaboration. Discuss the advantages and disadvantages of remote work."
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
