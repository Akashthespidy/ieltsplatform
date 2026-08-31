import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { SpeakingClient } from "@/components";

const speakingPrompts = [
  {
    id: "sp-part1",
    part: 1,
    partLabel: "Part 1: Introduction & Interview",
    topic: "Hometown & Neighborhood",
    instruction: "Describe the town or city where you grew up. What do you like most about it, and has it changed much in recent years? Speak naturally for 1–2 minutes.",
    bulletPoints: [
      "Where your hometown is located",
      "What is special or unique about the area",
      "Recent architectural or transportation changes",
      "Whether you would like to live there in the future"
    ]
  },
  {
    id: "sp-part2",
    part: 2,
    partLabel: "Part 2: Long Turn (Cue Card)",
    topic: "Describe an ambition that you have had for a long time",
    instruction: "You will have 1 minute to prepare your notes, and then you should speak for 1 to 2 minutes on this topic.",
    bulletPoints: [
      "What the ambition is and when you first thought of it",
      "What steps you have taken to achieve it",
      "Why it is important to you personally",
      "How you will feel when you finally accomplish it"
    ]
  },
  {
    id: "sp-part3",
    part: 3,
    partLabel: "Part 3: Two-Way Discussion",
    topic: "Ambition, Success, and Society",
    instruction: "Discuss how ambition influences societal progress. Do you think people today are more ambitious than previous generations? Discuss with analytical reasoning.",
    bulletPoints: [
      "The role of personal ambition vs teamwork in career success",
      "Whether modern social media fuels unrealistic ambitions",
      "How schools and universities should foster healthy ambition"
    ]
  },
  {
    id: "sp-part2-tech",
    part: 2,
    partLabel: "Part 2: Long Turn (Cue Card)",
    topic: "Describe a piece of technology you find difficult to use",
    instruction: "You will have 1 minute to prepare your notes, and then speak for up to 2 minutes.",
    bulletPoints: [
      "What the technology is and what it does",
      "When and where you encountered it",
      "Why you find it difficult or complicated to operate",
      "How you manage to overcome the difficulty"
    ]
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

