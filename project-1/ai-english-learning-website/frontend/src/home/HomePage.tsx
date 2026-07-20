import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Mic,
  PenTool,
  Sparkles,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  Sparkle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  const badges = [
    "Beginner Friendly",
    "Daily Practice",
    "Mock AI Feedback",
    "Progress Tracking"
  ];

  const steps = [
    { num: "1", title: "Learn Daily Lesson", desc: "Access bite-sized daily units covering grammar rules and new expressions." },
    { num: "2", title: "Practice speaking, writing, or reading", desc: "Complete interactive drills and read daily preview passages." },
    { num: "3", title: "Get Mock AI Feedback", desc: "Instantly see grammatical corrections, suggestions, and tips." },
    { num: "4", title: "Save Mistakes", desc: "Flag problematic answers to save them automatically to your review journal." },
    { num: "5", title: "Track Progress", desc: "Keep tabs on your study streaks, accuracy percentages, and history logs." }
  ];

  const features = [
    {
      icon: Calendar,
      title: "Daily Lessons",
      text: "Practice reading, vocabulary, grammar, and real-life examples day by day.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    },
    {
      icon: Mic,
      title: "Speaking Practice",
      text: "Practice simple speaking drills and daily conversation.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    },
    {
      icon: PenTool,
      title: "Writing & Grammar",
      text: "Improve writing with simple grammar practice and explanations.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    },
    {
      icon: Sparkles,
      title: "Mock AI Feedback",
      text: "Get AI-style feedback and suggestions to improve your answers.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    },
    {
      icon: AlertCircle,
      title: "Mistake Notebook",
      text: "Save weak answers and revise mistakes anytime.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      text: "Track daily practice and stay consistent.",
      color: "bg-violet-50 text-violet-600 border-violet-100/50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-150/80">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-600 p-2.5 text-white shadow-lg shadow-violet-600/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight text-lg block leading-none">English Daily</span>
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mt-1 block">Learn · Practice · Improve</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-500">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#flow" className="hover:text-violet-600 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-violet-600 transition-colors">Benefits</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? null : isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-md shadow-violet-600/10">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-extrabold px-4">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28 md:px-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/50 px-4 py-1 text-xs font-bold text-violet-700 shadow-sm"
              >
                <Sparkle size={12} className="fill-violet-600" /> {badge}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl md:text-6xl tracking-tight max-w-3xl mx-auto">
            Learn English Daily with AI Guidance
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base font-semibold text-slate-500 leading-relaxed">
            Practice speaking, writing, reading, grammar, and daily lessons with simple AI-style feedback, mistake tracking, and progress reports.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row pt-4">
            {!isLoading && (
              <>
                <Link to={isAuthenticated ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white border-none shadow-lg shadow-violet-600/20 font-black px-8 py-3.5 rounded-xl transition-all">
                    Start Learning <ArrowRight size={16} className="ml-1" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-100/50 font-black px-8 py-3.5 rounded-xl transition-all bg-white">
                      Login
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="mx-auto max-w-md rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 flex items-center gap-2 shadow-sm select-none">
            <span className="text-amber-600 font-extrabold text-sm shrink-0">⚠️</span>
            <span className="text-[10px] font-bold text-amber-800 text-left leading-normal">
              Frontend simulation mode is active. Simulated feedback acts as mock previews without calling live external AI API keys.
            </span>
          </div>
        </section>

        {/* How It Works */}
        <section id="flow" className="bg-white border-y border-slate-150 py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="text-center mb-16 space-y-1">
              <p className="text-xs font-black text-violet-600 uppercase tracking-widest">
                How It Works
              </p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Simple 5-Step Learning Method
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-150 rounded-2xl p-6 relative space-y-4 shadow-sm hover:border-violet-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-violet-600/10">
                    {step.num}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{step.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Card Section */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="text-center mb-16 space-y-1">
            <p className="text-xs font-black text-violet-600 uppercase tracking-widest">
              Core Capabilities
            </p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
              Everything You Need to Improve English
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, color }) => (
              <Card
                key={title}
                hoverable
                className="flex flex-col justify-between p-6 border border-slate-200 bg-white shadow-sm rounded-2xl"
              >
                <div className="space-y-4">
                  <div className={`inline-flex rounded-xl p-3 border ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
                    <p className="mt-2 text-xs font-bold text-slate-500 leading-relaxed">{text}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Benefits Info / Target section */}
          <div id="benefits" className="pt-20">
            <div className="max-w-4xl mx-auto bg-violet-50 rounded-2xl p-8 border border-violet-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-lg font-black text-violet-900">Consistent daily routines make all the difference</h3>
                <p className="text-xs text-violet-700 font-semibold">Practicing reading, vocabulary, speaking drills and writing exercises helps solidify English structure.</p>
              </div>
              <div className="flex items-center gap-1 bg-violet-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shrink-0">
                100% Student-first mock flow
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 rounded-3xl bg-violet-600 px-6 py-12 text-center text-white shadow-xl shadow-violet-600/20 border border-violet-700/10 max-w-4xl mx-auto space-y-6">
            <h3 className="text-2xl font-black sm:text-3xl leading-tight">
              20 minutes daily can improve your English step by step.
            </h3>
            <p className="text-xs sm:text-sm text-violet-100 font-semibold max-w-md mx-auto leading-relaxed">
              Start building your English learning routine with daily lessons and interactive mock feedback.
            </p>
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="inline-block">
              <button className="rounded-xl bg-white px-8 py-3.5 text-xs font-black text-violet-700 shadow-md hover:bg-violet-50 active:scale-[0.98] transition-all">
                Start Free Practice
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-150 bg-white py-6 text-center text-xs font-bold text-slate-400 select-none uppercase tracking-wider">
        English Daily · simulated practice ecosystem · Frontend prototype
      </footer>
    </div>
  );
}
