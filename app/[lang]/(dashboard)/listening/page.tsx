import { getDictionary, Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { ListeningClient } from "@/components";

const listeningTests = [
  {
    id: "sec-1-travel",
    sectionNumber: 1,
    sectionLabel: "Section 1: Social Conversation",
    title: "Booking an Eco-Lodge Holiday in the Scottish Highlands",
    audioPrompt: "Good morning, Glenmore Eco-Lodges, Sarah speaking. How can I help you today? Hello Sarah, I'd like to make a reservation for a family cabin next month. We're looking at arriving on Friday the fourteenth of October for five nights. Wonderful! For four guests, our Pine Tree Chalet includes solar heated water, complimentary electric bike hire, and an organic breakfast basket delivered every morning. The total rate is three hundred and eighty pounds including all local taxes.",
    questions: [
      {
        id: "lq1",
        text: "What is the arrival date requested by the caller?",
        options: [
          "Friday the 14th of October",
          "Monday the 4th of October",
          "Friday the 24th of October",
          "Wednesday the 14th of September"
        ],
        correctIndex: 0,
        explanation: "The caller explicitly states: 'arriving on Friday the fourteenth of October for five nights'."
      },
      {
        id: "lq2",
        text: "What complimentary service is included with the Pine Tree Chalet?",
        options: [
          "Airport shuttle transport",
          "Complimentary electric bike hire",
          "Free mountain guide tour",
          "Unlimited spa access"
        ],
        correctIndex: 1,
        explanation: "The receptionist mentions: 'includes solar heated water, complimentary electric bike hire, and an organic breakfast basket'."
      },
      {
        id: "lq3",
        text: "What is the total cost for the five-night stay?",
        options: [
          "£480",
          "£350",
          "£380",
          "£520"
        ],
        correctIndex: 2,
        explanation: "The quote given is: 'three hundred and eighty pounds including all local taxes (£380)'."
      }
    ]
  },
  {
    id: "sec-2-tour",
    sectionNumber: 2,
    sectionLabel: "Section 2: Local Monologue",
    title: "Guided Tour of the Maritime Heritage Museum",
    audioPrompt: "Welcome everyone to the City Maritime Museum. Before we begin our guided tour through the dockyards, please note that photography is permitted in all exhibition halls, but flash photography is strictly prohibited near the historic textile archives. Our main gallery houses over two thousand artifacts recovered from nineteenth-century merchant shipwrecks. The museum cafe on the third floor offers panoramic harbor views and is open until five-thirty PM.",
    questions: [
      {
        id: "lq4",
        text: "Where is flash photography strictly prohibited?",
        options: [
          "Near the historic textile archives",
          "Inside the shipwreck gallery",
          "Throughout the entire museum",
          "On the dockyard viewing platform"
        ],
        correctIndex: 0,
        explanation: "The guide states: 'flash photography is strictly prohibited near the historic textile archives'."
      },
      {
        id: "lq5",
        text: "What time does the third-floor museum cafe close?",
        options: [
          "5:00 PM",
          "5:30 PM",
          "6:00 PM",
          "4:30 PM"
        ],
        correctIndex: 1,
        explanation: "The guide confirms: 'is open until five-thirty PM (5:30 PM)'."
      }
    ]
  },
  {
    id: "sec-3-academic",
    sectionNumber: 3,
    sectionLabel: "Section 3: Academic Discussion",
    title: "Tutoring Session: Environmental Economics Project",
    audioPrompt: "Hi Alex, thanks for meeting. I've reviewed your draft on carbon offset mechanisms. Your critique of renewable energy credit markets is solid, but you need to expand your analysis on reforestation verification. Without third-party satellite audits, calculating net carbon capture over a thirty-year timeframe remains prone to exaggeration. I suggest incorporating the 2024 IPCC standard guidelines into your second chapter.",
    questions: [
      {
        id: "lq6",
        text: "What area of Alex's project needs expansion according to the tutor?",
        options: [
          "Renewable energy credit market pricing",
          "Analysis on reforestation verification",
          "Historical fossil fuel subsidies",
          "Urban solar rooftop installations"
        ],
        correctIndex: 1,
        explanation: "The tutor says: 'you need to expand your analysis on reforestation verification'."
      },
      {
        id: "lq7",
        text: "What framework does the tutor recommend citing in the second chapter?",
        options: [
          "Kyoto Protocol 1997",
          "The 2024 IPCC standard guidelines",
          "World Bank Carbon Pricing Report",
          "United Nations Biodiversity Act"
        ],
        correctIndex: 1,
        explanation: "The tutor explicitly suggests: 'incorporating the 2024 IPCC standard guidelines into your second chapter'."
      }
    ]
  },
  {
    id: "sec-4-lecture",
    sectionNumber: 4,
    sectionLabel: "Section 4: University Lecture",
    title: "Lecture: Marine Biomimicry in Modern Engineering",
    audioPrompt: "In today's lecture on biomimicry, we examine how marine adaptations inspire high-efficiency aerodynamic design. Consider the humpback whale. The irregular bumps on the leading edge of its flippers, termed tubercles, channel water flow and reduce drag by up to thirty-two percent while delaying stall at high angles of attack. Aeronautical engineers have successfully applied this morphological tubercle principle to wind turbine blades and aircraft wings, yielding significant reductions in noise emissions and remarkable gains in energy efficiency.",
    questions: [
      {
        id: "lq8",
        text: "What are the bumps on the leading edge of whale flippers called?",
        options: [
          "Spicules",
          "Tubercles",
          "Osteoderms",
          "Denticles"
        ],
        correctIndex: 1,
        explanation: "The lecturer refers to: 'The irregular bumps on the leading edge of its flippers, termed tubercles'."
      },
      {
        id: "lq9",
        text: "By how much can tubercles reduce drag according to the lecture?",
        options: [
          "Up to 15 percent",
          "Up to 32 percent",
          "Up to 45 percent",
          "Up to 50 percent"
        ],
        correctIndex: 1,
        explanation: "The lecturer mentions that tubercles 'reduce drag by up to thirty-two percent'."
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

