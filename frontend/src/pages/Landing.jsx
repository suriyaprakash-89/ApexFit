// frontend/src/pages/Landing.jsx
// Public marketing page for signed-out visitors. Everything stated here is true
// of the product today: no invented testimonials, ratings or user counts.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Brain,
  Target,
  Trophy,
  ScanFace,
  BarChart3,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  WifiOff,
  Smartphone,
  ArrowRight,
  Check,
  Menu,
  X,
  Footprints,
  Moon,
  Droplets,
  Flame,
  Sparkles,
  ChevronDown,
  Sun,
} from "lucide-react";
import { publicJson } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#coach", label: "AI coach" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Track your whole day",
    text: "Workouts, steps, sleep and water in one place. Most logs take a single tap.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "An AI coach that knows your week",
    text: "Ask anything. Answers use your real steps, sleep and workouts, not generic tips.",
    color: "from-primary-600 to-teal-500",
  },
  {
    icon: Target,
    title: "Goals that update themselves",
    text: "Set a target once. Progress fills in automatically as you log, with a nudge when you fall behind.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Trophy,
    title: "Challenges & achievements",
    text: "Join challenges or let the AI create one for you. Earn points, unlock badges and climb the leaderboard.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: ScanFace,
    title: "AR form check",
    text: "Hold a plank or wall sit and your camera checks your form in real time. Video never leaves your device.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: BarChart3,
    title: "Your 30-day Fitness DNA",
    text: "A clear monthly report on activity, sleep, hydration and consistency, with what to do next.",
    color: "from-rose-500 to-pink-500",
  },
];

const STEPS = [
  { title: "Create your free account", text: "Sign up with Google in one tap, or with email. Add your age and goals if you like; it takes a minute." },
  { title: "Log your day", text: "Tap to add water, enter steps and sleep, and save workouts. It even works offline and syncs later." },
  { title: "Get coached & level up", text: "Watch goals fill in, complete challenges, unlock achievements and ask your coach what to do next." },
];

const PRIVACY_POINTS = [
  { icon: Lock, title: "Only you can see your data", text: "Every record is locked to your account with database row-level security." },
  { icon: ShieldCheck, title: "Never sold, no ads", text: "We don't sell your data or show ads. Our AI provider doesn't train on it." },
  { icon: ScanFace, title: "Camera stays on your device", text: "AR form checks run in your browser. Video is never uploaded." },
  { icon: Download, title: "Export anytime", text: "Download everything you've logged as a file in one click." },
  { icon: Trash2, title: "Delete everything", text: "Delete your account and all your data permanently from Settings." },
  { icon: WifiOff, title: "Works offline", text: "Install it like an app. Logs made offline sync when you're back." },
];

const FAQS = [
  {
    q: "Is ApeXfit free?",
    a: "Yes. Every feature on this page is free to use. There's no credit card and no trial clock.",
  },
  {
    q: "Do I need a smartwatch or fitness tracker?",
    a: "No. You can log steps, sleep, water and workouts by hand in a few taps. The AR challenges only need your phone or laptop camera.",
  },
  {
    q: "Is the AI coach a doctor?",
    a: "No. It gives general fitness, nutrition and sleep guidance based on your logs. For pain, injuries or medical conditions it will tell you to see a qualified professional.",
  },
  {
    q: "What happens to my data?",
    a: "It's stored securely and only your account can read it. When you message the coach, the relevant context is sent to our AI provider (Groq) just to write the reply; they don't use it to train models. Read the full privacy page for details.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. It's built mobile-first. Open it in your phone's browser and choose \"Add to Home Screen\" to install it like a native app.",
  },
  {
    q: "Can I delete my account?",
    a: "Anytime, from Settings. It permanently deletes your account and everything you've logged. You can export a copy first.",
  },
];

/* ------------------------------ Product preview ----------------------------- */
// A static, illustrative miniature of the real dashboard (built from the same UI).
const ProductPreview = () => (
  <div className="relative" aria-hidden="true">
    <div className="absolute -inset-6 bg-gradient-to-tr from-primary-500/20 via-teal-400/20 to-lime-300/20 blur-3xl rounded-full" />
    <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Good morning, Priya</p>
          <p className="text-xs text-muted">Tuesday · 3 goals on track</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          🔥 6-day streak
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Footprints, label: "Steps", value: "8,412", pct: 84, grad: "from-blue-500 to-cyan-500" },
          { icon: Flame, label: "Active cal", value: "420", pct: 84, grad: "from-red-500 to-orange-500" },
          { icon: Moon, label: "Sleep", value: "7.4 h", pct: 92, grad: "from-purple-500 to-indigo-500" },
          { icon: Droplets, label: "Water", value: "6 / 8", pct: 75, grad: "from-teal-500 to-emerald-500" },
        ].map(({ icon: Icon, label, value, pct, grad }) => (
          <div key={label} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-muted">{label}</p>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-3 flex gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
          You've slept <strong>7.4 h</strong> on average this week, up from 6.5 h. A 20-minute walk after lunch gets you
          to your <strong>10,000-step</strong> goal today.
        </p>
      </div>
    </div>
    <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-3.5 py-2.5">
      <span className="text-xl">💧</span>
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-white">Achievement unlocked</p>
        <p className="text-[11px] text-muted">Hydration Hero · +100 pts</p>
      </div>
    </div>
  </div>
);

const CoachPreview = () => (
  <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden" aria-hidden="true">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Apex · AI Coach</p>
        <p className="text-xs text-muted">Personalised with your last 7 days</p>
      </div>
    </div>
    <div className="p-4 space-y-3 text-sm">
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-600 text-white px-3.5 py-2">
          I keep missing my workouts. What should I change?
        </p>
      </div>
      <div className="flex gap-2">
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gray-100 dark:bg-gray-700 px-3.5 py-2.5 text-gray-800 dark:text-gray-100 space-y-2">
          <p>You logged <strong>2 workouts</strong> this week, both on weekends. Let's make weekdays easier:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Book two <strong>20-minute</strong> sessions on Tue and Thu mornings</li>
            <li>Lay out your shoes the night before</li>
            <li>Join a 5-day challenge for a little accountability</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

/* --------------------------------- Sections --------------------------------- */
const Header = () => {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200/70 dark:border-gray-800 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5" aria-label="ApeXfit home">
          <img src="/logo.png" alt="" className="w-9 h-9 rounded-full" />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ape<span className="text-primary-600 dark:text-primary-400">X</span>fit
          </span>
        </a>
        <nav className="hidden lg:flex items-center gap-1" aria-label="Page sections">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="icon-btn"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login" className="hidden sm:inline-flex btn-secondary">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary">
            Start free
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="icon-btn lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="landing-menu" className="lg:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1" aria-label="Page sections">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className="btn-secondary w-full mt-2 sm:hidden">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
};

const SectionHeading = ({ eyebrow, title, text, center = true }) => (
  <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
    <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">{eyebrow}</p>
    <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
    {text && <p className="mt-4 text-lg text-muted">{text}</p>}
  </div>
);

const LiveStats = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    publicJson("/api/public/stats").then(setStats).catch(() => setStats(null));
  }, []);
  // Only show real numbers once they're meaningful; never pad them.
  if (!stats || stats.athletes < 25) return null;
  const items = [
    { value: stats.athletes, label: "athletes training" },
    { value: stats.activitiesLogged, label: "workouts logged" },
    { value: stats.challengesCompleted, label: "challenges completed" },
  ];
  return (
    <section aria-label="ApeXfit in numbers" className="py-12 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <dl className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="sr-only">{i.label}</dt>
            <dd className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">{i.value.toLocaleString()}</dd>
            <dd className="mt-1 text-sm text-muted">{i.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const Landing = () => {
  useEffect(() => {
    document.title = "ApeXfit · Free fitness tracker with an AI health coach";
  }, []);

  return (
    <div id="top" className="min-h-dvh bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn-primary">
        Skip to content
      </a>
      <Header />

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-0 bg-gradient-to-b from-primary-50 via-gray-50 to-gray-50 dark:from-primary-950/40 dark:via-gray-900 dark:to-gray-900" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800 bg-white/70 dark:bg-gray-800/70 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Free · AI coach included
              </p>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Your fitness,{" "}
                <span className="bg-gradient-to-r from-primary-600 via-teal-500 to-lime-500 bg-clip-text text-transparent">
                  finally in one place.
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl">
                Log workouts, steps, sleep and water in seconds. ApeXfit turns them into goals that track themselves,
                challenges that keep you going, and coaching that fits your actual day.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="btn-primary text-base px-6 min-h-[52px]">
                  Start free <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="btn-secondary text-base px-6 min-h-[52px]">
                  See how it works
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {["No credit card", "Works on any device", "Export or delete anytime"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <ProductPreview />
          </div>
        </section>

        <LiveStats />

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Everything in one app"
              title="Built to make healthy habits stick"
              text="Not another spreadsheet. ApeXfit connects what you log to goals, challenges and advice, so every entry moves you forward."
            />
            <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, text, color }) => (
                <li key={title} className="card hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24 bg-white dark:bg-gray-800/40 border-y border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="How it works" title="Up and running in three steps" />
            <ol className="mt-14 grid md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white text-lg font-bold shadow-sm">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI coach spotlight */}
        <section id="coach" className="scroll-mt-20 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                center={false}
                eyebrow="AI health coach"
                title="Advice based on your week, not a template"
                text="Apex sees your recent steps, sleep, water, workouts and goals, so its answers are about you."
              />
              <ul className="mt-8 space-y-4">
                {[
                  "Workout plans that fit the time you actually have",
                  "Sleep, hydration and recovery tips tied to your trends",
                  "Safety first: it flags pain or injury and points you to a professional",
                  "A 30-day Fitness DNA report with your next best steps",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-700 dark:text-primary-300" aria-hidden="true" />
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted">General guidance, not medical advice.</p>
            </div>
            <CoachPreview />
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-20 py-20 sm:py-24 bg-gray-900 text-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">Private by design</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Your health data stays yours</h2>
              <p className="mt-4 text-lg text-gray-300">
                Fitness data is personal. Here's exactly how we treat it, in plain language.
              </p>
            </div>
            <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PRIVACY_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <Icon className="w-6 h-6 text-teal-300" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-gray-300">{text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center">
              <Link to="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-teal-300 hover:text-teal-200 underline-offset-4 hover:underline">
                Read the full privacy page <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>

        {/* Install */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card !p-8 sm:!p-10 grid md:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Install it like an app</h2>
                <p className="mt-2 text-muted">
                  On your phone, open ApeXfit in the browser and choose <strong>Add to Home Screen</strong>. It launches
                  full-screen, works offline, and syncs your logs when you reconnect. No app store needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 pb-20 sm:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="FAQ" title="Questions, answered" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group card !p-0 overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 font-semibold text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="w-5 h-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="px-5 pb-5 text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-20 sm:pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-teal-600 px-6 py-14 sm:px-12 text-center text-white shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start building better habits today</h2>
              <p className="mt-4 text-lg text-white/85 max-w-xl mx-auto">
                Free to use. Set up in a minute. Your first goal can be done before tonight.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 text-base px-6 min-h-[52px]">
                  Create your free account <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10 text-base px-6 min-h-[52px]">
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-gray-900 dark:text-white">ApeXfit</span>
            <span className="text-sm text-muted">· Train smarter, every day.</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
            <a href="#features" className="text-muted hover:text-gray-900 dark:hover:text-white">Features</a>
            <a href="#faq" className="text-muted hover:text-gray-900 dark:hover:text-white">FAQ</a>
            <Link to="/privacy" className="text-muted hover:text-gray-900 dark:hover:text-white">Privacy</Link>
            <Link to="/login" className="text-muted hover:text-gray-900 dark:hover:text-white">Sign in</Link>
          </nav>
          <p className="text-sm text-muted">© {new Date().getFullYear()} ApeXfit</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
