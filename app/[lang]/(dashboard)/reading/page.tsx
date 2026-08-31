import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { ReadingClient } from "@/components";

// Structured academic reading passages with full explanations
const passages = [
  {
    id: "climate-change-marine",
    passageNumber: 1,
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
        topic: "Detail Retrieval",
        explanation: "The text explains: 'When corals experience thermal stress, they expel the symbiotic algae living in their tissues, turning completely white.'"
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
        topic: "Factual Information",
        explanation: "The passage notes: 'oceans absorb approximately 30 percent of the carbon dioxide emitted into the atmosphere'."
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
        topic: "Vocabulary Comprehension",
        explanation: "Acidification is defined as: 'causing chemical reactions that lower the water pH—a process known as ocean acidification'."
      }
    ]
  },
  {
    id: "history-language-evolution",
    passageNumber: 2,
    title: "A Brief History of Language Evolution and Dialect Dispersion",
    text: "Languages are not static entities; they evolve continuously over centuries through migrations, social integrations, and technological advancements. The ancestor of many modern European and Asian languages is Proto-Indo-European, spoken around 5,000 years ago. As speaker communities dispersed, geographic isolation accelerated dialects, splitting the base language into Germanic, Romance, Indo-Iranian, and other branches. For instance, Old English was heavily influenced by Germanic invaders. Later, the Norman Conquest of 1066 introduced French-speaking rulers to England, embedding thousands of French and Latin terms into the vocabulary, which catalyzed the shift to Middle English. In the modern era, globalization and digital communication are driving language evolution at unprecedented speeds, introducing new terminologies while causing indigenous dialects to shrink.",
    wordCount: 121,
    questions: [
      {
        id: "lang-q1",
        text: "Which ancestral language is the source of many modern European languages?",
        options: [
          "Classical Latin",
          "Proto-Indo-European",
          "Proto-Germanic",
          "Old English"
        ],
        correctIndex: 1,
        topic: "Factual Information",
        explanation: "The text states: 'The ancestor of many modern European and Asian languages is Proto-Indo-European'."
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
        topic: "Historical Connections",
        explanation: "The passage notes: 'the Norman Conquest of 1066 introduced French-speaking rulers... which catalyzed the shift to Middle English'."
      }
    ]
  },
  {
    id: "ai-neuroscience-biomimicry",
    passageNumber: 3,
    title: "Artificial Neural Architectures and Biological Parallels",
    text: "The conceptual foundation of artificial intelligence draws heavy inspiration from computational neuroscience. Deep neural networks consist of interconnected nodes arranged in sequential layers, mathematically approximating synaptic transmissions between biological neurons. In the human visual cortex, specialized neural clusters process visual stimuli hierarchically—detecting raw edges, then complex geometries, and finally holistic facial features. Similarly, convolutional neural networks (CNNs) learn spatial hierarchies of features automatically through backpropagation algorithms. However, while human cognition relies on sparse, highly energy-efficient electrochemical signals consuming merely twenty watts of metabolic power, contemporary artificial model training demands vast mega-watt electricity infrastructures.",
    wordCount: 104,
    questions: [
      {
        id: "ai-q1",
        text: "How does the human visual cortex process stimuli according to the text?",
        options: [
          "Through random electrochemical pulses",
          "Hierarchically, from raw edges to holistic features",
          "Via backpropagation algorithms exclusively",
          "By consuming high mega-watt power clusters"
        ],
        correctIndex: 1,
        topic: "Detail Comprehension",
        explanation: "The passage states: 'In the human visual cortex, specialized neural clusters process visual stimuli hierarchically—detecting raw edges, then complex geometries, and finally holistic facial features.'"
      },
      {
        id: "ai-q2",
        text: "What key difference between human cognition and AI model training is emphasized?",
        options: [
          "Human brain cannot process spatial hierarchies",
          "CNNs do not use synaptic approximations",
          "Human cognition is extremely energy-efficient compared to high-power AI training",
          "Biological neurons require external cooling infrastructures"
        ],
        correctIndex: 2,
        topic: "Comparative Analysis",
        explanation: "The text contrasts human metabolic power ('merely twenty watts') with modern AI training demanding 'vast mega-watt electricity infrastructures'."
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
          Read academic passages, adjust font preferences, track timer diagnostics, and get detailed AI feedback.
        </p>
      </div>

      <ReadingClient passages={passages} dict={dict} />
    </div>
  );
}

