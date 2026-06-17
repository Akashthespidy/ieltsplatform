import { getDictionary, Locale, hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  BookOpen, 
  Mic, 
  PenTool, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  MessageSquare,
  Shield,
  Zap,
  HelpCircle,
  Check
} from "lucide-react";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang as Locale);

  const features = [
    {
      icon: BookOpen,
      title: "Reading Evaluation",
      desc: "Interactive passages with speed & comprehension diagnostics parsed by AI.",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: PenTool,
      title: "Writing Essay Coach",
      desc: "Instant assessment of grammar, syntax, vocabulary, and structural coherence.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Mic,
      title: "Speaking Assessment",
      desc: "Advanced pronunciation, grammar, and fluency evaluations powered by Whisper transcriptions.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Sparkles,
      title: "Spaced Repetition Vocab",
      desc: "SuperMemo-2 algorithm automatically calculates optimal revision schedules.",
      color: "from-amber-500 to-orange-500",
    },
  ];

  const steps = [
    { num: "01", title: "Select Native Language", desc: "Choose from 10+ translation languages to ease vocabulary learning." },
    { num: "02", title: "Take Placement Test", desc: "Complete a quick diagnostic test to estimate your CEFR level and IELTS bands." },
    { num: "03", title: "Start Personalized Plan", desc: "AI automatically targets your grammar, reading, and pronunciation weaknesses." },
  ];

  const faqs = [
    { q: "How does the placement test estimate my IELTS band?", a: "The placement test assesses grammar accuracy, reading comprehension, and writing complexity using OpenAI's structured outputs matching official IELTS scoring bands." },
    { q: "Which languages are supported for translation?", a: "We support translations into Bangla, Japanese, Spanish, Arabic, French, and more to ensure you learn contextually." },
    { q: "Can I cancel my subscription anytime?", a: "Yes, you can manage your plan easily in the Settings dashboard under the Billing settings." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800/80 backdrop-blur bg-zinc-950/80 sticky top-0 z-50 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-purple-500 animate-pulse" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            LinguaTrack AI
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-50 transition-colors">{dict.landing.features}</a>
          <a href="#how-it-works" className="hover:text-zinc-50 transition-colors">{dict.landing.howItWorks}</a>
          <a href="#pricing" className="hover:text-zinc-50 transition-colors">{dict.landing.pricing}</a>
          <a href="#faq" className="hover:text-zinc-50 transition-colors">{dict.landing.faq}</a>
        </nav>
        <div className="flex items-center gap-4">
          {/* Language Switcher Link */}
          <div className="flex items-center gap-1.5 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-400">
            <span className="font-semibold uppercase">{lang}</span>
          </div>
          <Link 
            href={`/${lang}/dashboard`}
            className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-all shadow-md shadow-purple-600/20"
          >
            Dashboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-950/20 px-3 py-1 rounded-full text-xs font-medium text-purple-300 mb-6 backdrop-blur">
          <Sparkles className="h-3 w-3 text-purple-400" />
          Powered by Next.js 16 & OpenAI API
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent leading-[1.1] mb-6">
          {dict.landing.title}
        </h1>

        <p className="max-w-2xl text-lg text-zinc-400 leading-relaxed mb-10">
          {dict.landing.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href={`/${lang}/onboarding`}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto justify-center"
          >
            {dict.landing.getStarted}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="px-6 py-3.5 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-xl transition-all w-full sm:w-auto justify-center text-center"
          >
            {dict.landing.learnMore}
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              Everything you need to master English
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              LinguaTrack AI evaluates all five core English skills using deep AI diagnostics and maps customized lessons dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div 
                key={idx}
                className="group relative border border-zinc-800/80 bg-zinc-900/30 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300 backdrop-blur"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} p-3 mb-6 text-white group-hover:scale-110 transition-transform`}>
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{feat.title}</h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-6 py-20 border-t border-zinc-900 bg-zinc-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              Your Personalized Path to Fluency
            </h2>
            <p className="text-zinc-400 text-sm">
              We streamline learning with structured tests, translations in your native tongue, and smart feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-4">
                <span className="text-4xl font-extrabold text-purple-500/30 mb-4 font-mono">{step.num}</span>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              Loved by English Learners Globally
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 backdrop-blur">
              <p className="text-zinc-400 text-sm italic mb-6">
                &ldquo;The AI writing coach is incredible! The highlighted inline mistakes showed me exactly where my structure was failing, raising my IELTS writing estimation score from a 6.0 to 7.5 in under a month.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">Y</div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Yuki Sato</h4>
                  <span className="text-zinc-500 text-xs">Tokyo, Japan</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 backdrop-blur">
              <p className="text-zinc-400 text-sm italic mb-6">
                &ldquo;Spaced repetition vocabulary cards translated directly into my native Bangla made remembering complex words like pernicious and pragmatic incredibly natural.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-xs">R</div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Rahat Ahmed</h4>
                  <span className="text-zinc-500 text-xs">Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 border-t border-zinc-900 bg-zinc-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-zinc-400 text-sm">
              All plans include complete access to writing checks, reading passages, and vocal evaluation modules.
            </p>
          </div>

          <div className="border border-purple-500/40 bg-zinc-950/80 rounded-3xl p-8 max-w-md mx-auto relative shadow-2xl shadow-purple-500/5 backdrop-blur">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 rounded-full text-xs font-bold text-white tracking-wide uppercase">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Premium Pro</h3>
            <span className="text-4xl font-extrabold text-white font-mono">$19</span>
            <span className="text-zinc-400 text-sm">/month</span>
            <hr className="border-zinc-800 my-6" />
            <ul className="text-left flex flex-col gap-4 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-500" />
                Unlimited Writing & Essay AI Reviews
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-500" />
                Speech transcription & accent evaluations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-500" />
                Spaced repetition card metrics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-500" />
                CEFR & IELTS Band analytics dashboard
              </li>
            </ul>
            <Link
              href={`/${lang}/onboarding`}
              className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-600/30"
            >
              Start 7-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-zinc-800 pb-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2 flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm pl-7 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 border-t border-zinc-900 bg-gradient-to-b from-zinc-950 to-zinc-900/40 text-center relative overflow-hidden">
        <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[350px] h-[350px] bg-pink-600/5 blur-[80px] rounded-full pointer-events-none" />
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          {dict.landing.ctaTitle}
        </h2>
        <p className="max-w-md mx-auto text-zinc-400 text-xs sm:text-sm mb-8">
          {dict.landing.ctaSubtitle}
        </p>
        <Link
          href={`/${lang}/onboarding`}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl transition-all shadow-xl shadow-white/5"
        >
          {dict.landing.ctaBtn}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-500 bg-zinc-950">
        <p>&copy; 2026 LinguaTrack AI. All rights reserved. Built for global learners.</p>
      </footer>
    </div>
  );
}
