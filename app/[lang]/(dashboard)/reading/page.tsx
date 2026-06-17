import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { ReadingClient } from "@/components";

// Structured static reading passages
const passages = [
  {
    id: "climate-change",
    title: "The Impact of Climate Change on Marine Ecosystems",
    text: "Ocean warming, acidification, and oxygen depletion are altering marine ecosystems in profound ways. Rising sea surface temperatures are driving the redistribution of fish stocks, pushing cold-water species toward higher latitudes and causing widespread coral bleaching. When corals experience thermal stress, they expel the symbiotic algae (zooxanthellae) living in their tissues, turning completely white. Without these algae, corals are vulnerable to disease, starvation, and eventual mortality. Furthermore, oceans absorb approximately 30 percent of the carbon dioxide emitted into the atmosphere, causing chemical reactions that lower the water pH—a process known as ocean acidification. This reduction in pH impairs the capacity of calcifying marine organisms, such as shellfish and corals, to build skeletons and shells, disrupting the food web from its base.",
    wordCount: 139,
    questions: [
      {
        id: "q1",
        text: "What is the primary cause of coral bleaching mentioned in the text?",
        options: [
          "Chemical pollution from plastic wastes",
          "Thermal stress forcing corals to expel symbiotic algae",
          "Severe oxygen depletion in deep sea currents",
          "Disruption of ocean pH balances"
        ],
        correctIndex: 1,
        topic: "Detail Retrieval"
      },
      {
        id: "q2",
        text: "How much atmospheric carbon dioxide do oceans absorb?",
        options: [
          "Around 10 percent",
          "Exactly 50 percent",
          "Approximately 30 percent",
          "Nearly 75 percent"
        ],
        correctIndex: 2,
        topic: "Factual Information"
      },
      {
        id: "q3",
        text: "Ocean acidification refers to which chemical process?",
        options: [
          "An increase in sea surface temperatures",
          "The chemical breakdown of shellfish shells in warm currents",
          "Reactions that lower the water pH due to carbon dioxide absorption",
          "Oxygen gas depletion in sub-tropical marine zones"
        ],
        correctIndex: 2,
        topic: "Vocabulary/Term Comprehension"
      }
    ]
  },
  {
    id: "history-language",
    title: "A Brief History of Language Evolution",
    text: "Languages are not static entities; they evolve continuously over centuries through migrations, social integrations, and technological advancements. The ancestor of many modern European and Asian languages is Proto-Indo-European, spoken around 5,000 years ago. As speaker communities dispersed, geographic isolation accelerated dialects, splitting the base language into Germanic, Romance, Indo-Iranian, and other branches. For instance, Old English was heavily influenced by Germanic invaders. Later, the Norman Conquest of 1066 introduced French-speaking rulers to England, embedding thousands of French and Latin terms into the vocabulary, which catalyzed the shift to Middle English. In the modern era, globalization and digital communication are driving language evolution at unprecedented speeds, introducing new terminologies while causing indigenous dialects to shrink.",
    wordCount: 121,
    questions: [
      {
        id: "lang-q1",
        text: "Which ancestral language is the source of many modern European languages?",
        options: [
          "Latin",
          "Proto-Indo-European",
          "Proto-Germanic",
          "Old English"
        ],
        correctIndex: 1,
        topic: "Factual Information"
      },
      {
        id: "lang-q2",
        text: "What historical event catalyzed the transition from Old English to Middle English?",
        options: [
          "The Roman Empire colonization of Britain",
          "The rise of digital communication networks",
          "The Norman Conquest of 1066",
          "Speaker communities migrating to higher latitudes"
        ],
        correctIndex: 2,
        topic: "Historical Connections"
      }
    ]
  }
];

export default async function ReadingPage({
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
          {dict.reading.title}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Read the passage, complete the questions on the right, and submit for AI speed and accuracy diagnostics.
        </p>
      </div>

      <ReadingClient passages={passages} dict={dict} />
    </div>
  );
}
