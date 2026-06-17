import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import ListeningClient from "./listening-client";

const listeningTests = [
  {
    id: "lst-1",
    title: "The Mechanics of Solar Flares",
    audioPrompt: "Welcome to this science brief. Solar flares are colossal explosions on the surface of the sun, releasing massive amounts of energy equivalent to millions of hydrogen bombs. They occur when intense magnetic field lines on the sun become tangled and suddenly snap, releasing plasma into space. This solar wind can travel towards Earth, creating beautiful auroras in polar regions, but also disrupting communication networks and satellite operations. Scientists classify flares into categories, with X-class being the most powerful.",
    questions: [
      {
        id: "lq1",
        text: "What is the equivalent energy released by solar flares according to the text?",
        options: [
          "Millions of hydrogen bombs",
          "Dozens of lightning strikes",
          "Hundreds of nuclear power grids",
          "Thousands of active volcanoes"
        ],
        correctIndex: 0
      },
      {
        id: "lq2",
        text: "Which class of solar flares is categorized as the most powerful?",
        options: [
          "A-class",
          "M-class",
          "C-class",
          "X-class"
        ],
        correctIndex: 3
      }
    ]
  },
  {
    id: "lst-2",
    title: "Innovations in Vertical Farming",
    audioPrompt: "In response to urban crowding and soil depletion, vertical farming has emerged as a promising agricultural alternative. This method crops plants indoors, stacked vertically in climate-controlled towers. By utilizing hydroponic or aeroponic water delivery systems, vertical farms consume ninety-five percent less water than traditional field farms. Additionally, the complete absence of seasonal weather changes eliminates crop failures, and artificial LED lights optimize photosynthesis rates. However, the heavy electricity consumption required to run climate systems remains a primary bottleneck.",
    questions: [
      {
        id: "lq3",
        text: "How much less water do vertical farms consume compared to traditional field farms?",
        options: [
          "50 percent less",
          "95 percent less",
          "30 percent less",
          "70 percent less"
        ],
        correctIndex: 1
      },
      {
        id: "lq4",
        text: "What is the primary bottleneck of vertical farming mentioned in the talk?",
        options: [
          "Soil nutrient erosion",
          "Lack of pollinating bees",
          "Heavy electricity consumption",
          "Uncontrollable weather shifts"
        ],
        correctIndex: 2
      }
    ]
  }
];

export default async function ListeningPage({
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
          {dict.listening.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {dict.listening.subtitle}
        </p>
      </div>

      <ListeningClient tests={listeningTests} dict={dict} />
    </div>
  );
}
