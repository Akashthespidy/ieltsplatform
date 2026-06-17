import { db } from "./index";
import { wordBank } from "./schema";

const wordsToSeed = [
  {
    word: "Resilient",
    ipa: "/rɪˈzɪl.jənt/",
    definition: "Able to recoil or spring back into shape after bending, stretching, or being compressed. Able to withstand or recover quickly from difficult conditions.",
    translatedDefinitions: {
      bn: "সহনশীল / স্থিতিস্থাপক",
      ja: "回復力のある / 弾力的な",
      es: "Resiliente / elástico",
      ar: "مرن / قادر على التعافي",
      fr: "Résilient / élastique"
    },
    exampleSentence: "She is a resilient girl who quickly recovered from the tragic loss.",
    translatedSentences: {
      bn: "তিনি একজন সহনশীল মেয়ে যিনি দুঃখজনক ক্ষতি থেকে দ্রুত পুনরুদ্ধার পেয়েছেন।",
      ja: "彼女は悲劇的な喪失からすぐに立ち直った回復力のある女の子です。",
      es: "Ella es una chica resiliente que se recuperó rápidamente de la trágica pérdida.",
      ar: "إنها فتاة مرنة تعافت بسرعة من الخسارة المأساوية.",
      fr: "C'est une fille résiliente qui s'est rapidement remise de cette perte tragique."
    },
    synonyms: ["tough", "hardy", "flexible", "adaptable"],
    antonyms: ["fragile", "vulnerable", "weak", "rigid"],
    difficulty: "medium",
    usageFrequency: 0.72
  },
  {
    word: "Eloquent",
    ipa: "/ˈel.ə.kwənt/",
    definition: "Fluent or persuasive in speaking or writing.",
    translatedDefinitions: {
      bn: "বাকপটু / সুবক্তা",
      ja: "雄弁な / 流暢な",
      es: "Elocuente",
      ar: "فصيح / بليغ",
      fr: "Éloquent"
    },
    exampleSentence: "The president gave an eloquent speech that moved the entire nation.",
    translatedSentences: {
      bn: "রাষ্ট্রপতি একটি বাকপটু ভাষণ দিয়েছিলেন যা পুরো জাতিকে নাড়া দিয়েছিল।",
      ja: "大統領は国家全体を感動させる雄弁な演説を行いました。",
      es: "El presidente dio un discurso elocuente que conmovió a toda la nación.",
      ar: "ألقى الرئيس خطابًا بليغًا هز الأمة بأكملها.",
      fr: "Le président a prononcé un discours éloquent qui a ému la nation entière."
    },
    synonyms: ["articulate", "expressive", "persuasive", "fluent"],
    antonyms: ["inarticulate", "tongue-tied", "silent", "hesitant"],
    difficulty: "hard",
    usageFrequency: 0.65
  },
  {
    word: "Pragmatic",
    ipa: "/præɡˈmæt.ɪk/",
    definition: "Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.",
    translatedDefinitions: {
      bn: "বাস্তবধর্মী / বাস্তবমুখী",
      ja: "実用的な / 現実的な",
      es: "Pragmático / práctico",
      ar: "عملي / واقعي",
      fr: "Pragmatique / concret"
    },
    exampleSentence: "We need to adopt a pragmatic approach to solve this budget deficit.",
    translatedSentences: {
      bn: "এই বাজেট ঘাটতি সমাধান করতে আমাদের একটি বাস্তবমুখী পদ্ধতি গ্রহণ করা দরকার।",
      ja: "この予算赤字を解決するためには、実用的なアプローチを採用する必要があります。",
      es: "Necesitamos adoptar un enfoque pragmático para resolver este déficit presupuestario.",
      ar: "نحن بحاجة إلى اعتماد نهج عملي لحل هذا العجز في الميزانية.",
      fr: "Nous devons adopter une approche pragmatique pour résoudre ce déficit budgétaire."
    },
    synonyms: ["practical", "realistic", "logical", "sensible"],
    antonyms: ["idealistic", "impractical", "visionary", "unrealistic"],
    difficulty: "medium",
    usageFrequency: 0.81
  },
  {
    word: "Ubiquitous",
    ipa: "/juːˈbɪk.wɪ.təs/",
    definition: "Present, appearing, or found everywhere.",
    translatedDefinitions: {
      bn: "সর্বব্যাপী / সর্বত্র বিদ্যমান",
      ja: "至る所にある / 偏在する",
      es: "Ubicuo / omnipresente",
      ar: "كلي الوجود / واسع الانتشار",
      fr: "Omniprésent / ubiquiste"
    },
    exampleSentence: "Smartphones are now ubiquitous in modern society.",
    translatedSentences: {
      bn: "স্মার্টফোন এখন আধুনিক সমাজে সর্বব্যাপী।",
      ja: "スマートフォンは今や現代社会の至る所にあります。",
      es: "Los teléfonos inteligentes son ahora ubicuos en la sociedad moderna.",
      ar: "الهواتف الذكية أصبحت الآن واسعة الانتشار في المجتمع الحديث.",
      fr: "Les smartphones sont désormais omniprésents dans la société moderne."
    },
    synonyms: ["omnipresent", "everywhere", "pervasive", "universal"],
    antonyms: ["rare", "scarce", "infrequent", "uncommon"],
    difficulty: "hard",
    usageFrequency: 0.58
  },
  {
    word: "Pernicious",
    ipa: "/pəˈnɪʃ.əs/",
    definition: "Having a harmful effect, especially in a gradual or subtle way.",
    translatedDefinitions: {
      bn: "ক্ষতিকর / অনিষ্টকর",
      ja: "有害な / 致命的な",
      es: "Pernicioso / dañino",
      ar: "خبيث / ضار",
      fr: "Pernicieux / nocif"
    },
    exampleSentence: "The pernicious influence of fake news can damage democratic institutions.",
    translatedSentences: {
      bn: "ভুয়ো খবরের ক্ষতিকর প্রভাব গণতান্ত্রিক প্রতিষ্ঠানগুলোকে ক্ষতিগ্রস্ত করতে পারে।",
      ja: "フェイクニュースの有害な影響は、民主主義制度を損なう可能性があります。",
      es: "La influencia perniciosa de las noticias falsas puede dañar las instituciones democráticas.",
      ar: "التأثير الخبيث للأخبار المزيفة يمكن أن يلحق الضرر بالمؤسسات الديمقراطية.",
      fr: "L'influence pernicieuse des fausses nouvelles peut endommager les institutions démocratiques."
    },
    synonyms: ["harmful", "damaging", "destructive", "adverse"],
    antonyms: ["beneficial", "harmless", "wholesome", "salutary"],
    difficulty: "hard",
    usageFrequency: 0.49
  }
];

async function main() {
  console.log("Seeding word bank...");
  for (const word of wordsToSeed) {
    try {
      await db.insert(wordBank).values({
        word: word.word,
        ipa: word.ipa,
        definition: word.definition,
        translatedDefinitions: word.translatedDefinitions,
        exampleSentence: word.exampleSentence,
        translatedSentences: word.translatedSentences,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
        difficulty: word.difficulty,
        usageFrequency: word.usageFrequency,
      }).onConflictDoNothing();
      console.log(`Successfully seeded word: ${word.word}`);
    } catch (e) {
      console.error(`Error seeding word: ${word.word}`, e);
    }
  }
  console.log("Seeding completed successfully.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
