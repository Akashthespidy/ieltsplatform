import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { SpeakingClient } from "@/components";

const speakingPrompts = [
  {
    id: "sp-1",
    topic: "Describe a memorable book you have read recently.",
    instruction: "Explain what the book is about, why you chose to read it, and why it made a lasting impression on you. Try to speak for 1-2 minutes."
  },
  {
    id: "sp-2",
    topic: "Discuss the pros and cons of dynamic urban environments.",
    instruction: "Explain why people gravitate toward large metropolitan centers, and describe the difficulties they face. Speak clearly for about 1 minute."
  }
];

export default async function SpeakingPage({
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
          {dict.speaking.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {dict.speaking.subtitle}
        </p>
      </div>

      <SpeakingClient prompts={speakingPrompts} dict={dict} />
    </div>
  );
}
