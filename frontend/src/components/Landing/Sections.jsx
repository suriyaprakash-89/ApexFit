// Landing page sections. Markup only: motion is orchestrated in pages/Landing.jsx via data-* hooks,
// so with reduced motion (or before JS runs) every section is simply visible content.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  Check,
  Download,
  Dumbbell,
  Flame,
  Lock,
  Menu,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  WifiOff,
  Medal,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/shadcn/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcn/accordion";
import { publicJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CoachMock, DashboardMock, LogMock, Odo, PanelFrame, WorkoutMock } from "./mocks";

const NAV_LINKS = [
  { href: "#experience", label: "Experience" },
  { href: "#workouts", label: "Workouts" },
  { href: "#progress", label: "Progress" },
  { href: "#coach", label: "AI coach" },
  { href: "#play", label: "Challenges" },
  { href: "#faq", label: "FAQ" },
];

const Wordmark = () => (
  <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
    Ape<span className="text-primary">X</span>fit
  </span>
);

/* --------------------------------- Header --------------------------------- */
export const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 safe-top transition-[background,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b border-white/10 bg-background/80 backdrop-blur-xl" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg" aria-label="ApeXfit home">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-full ring-1 ring-white/15" />
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Page sections">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Start free</Link>
          </Button>
          <button type="button" className="icon-btn lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">Jump to a section or sign in</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1" aria-label="Page sections">
                {NAV_LINKS.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <a href={l.href} className="rounded-xl px-3 py-3.5 text-lg font-semibold text-foreground hover:bg-accent">
                      {l.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-2">
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="lg">
                  <Link to="/register">Start free</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

/* ----------------------------------- Hero ---------------------------------- */
const Line = ({ children, className }) => (
  <span className="block overflow-hidden pb-[0.08em]">
    <span data-hero-line className={cn("block", className)}>
      {children}
    </span>
  </span>
);

export const Hero = () => (
  <section data-hero className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-24 pt-28 sm:pt-32">
    {/* background: grid + drifting light */}
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 50% 30%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, black, transparent 80%)",
        }}
      />
      <div data-orb data-speed="0.25" className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-primary/20 blur-[120px]" />
      <div data-orb data-speed="-0.15" className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-pulse-500/15 blur-[120px]" />
      <svg className="absolute inset-x-0 bottom-10 w-full opacity-60" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
        <path
          data-draw
          d="M0 70 H380 L410 70 L430 30 L460 105 L490 10 L520 90 L545 70 H900 L930 70 L950 45 L975 95 L1000 70 H1440"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>

    <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
      <div className="lg:col-span-7">
        <p
          data-hero-fade
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Intelligent fitness companion · free
        </p>
        <h1 className="mt-6 text-[clamp(2.9rem,10.5vw,7.25rem)] font-black uppercase leading-[0.88] tracking-[-0.03em] text-foreground [font-stretch:80%]">
          <Line>Train with</Line>
          <Line className="text-primary">intent.</Line>
        </h1>
        <p data-hero-fade className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          ApeXfit tracks your workouts, steps, sleep and water, then turns them into goals, streaks and coaching that
          actually fit your week.
        </p>
        <div data-hero-fade className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="sm:min-w-[200px]">
            <Link to="/register">
              Start free <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#experience">See how it works</a>
          </Button>
        </div>
        <ul data-hero-fade className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["No credit card", "Works offline", "Export or delete anytime"].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative lg:col-span-5">
        <div data-hero-panel data-speed="-0.06" className="relative z-10 mx-auto max-w-sm lg:max-w-none">
          <DashboardMock />
        </div>
        <div
          data-hero-panel
          data-speed="0.1"
          className="relative z-20 -mt-6 ml-auto hidden w-[85%] sm:block lg:absolute lg:-bottom-16 lg:-left-16 lg:right-auto lg:mt-0 lg:w-[78%]"
        >
          <PanelFrame className="!p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Trophy className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Personal record</p>
                <p className="text-xs text-muted-foreground">Bench press · 75 kg × 6 · example</p>
              </div>
            </div>
          </PanelFrame>
        </div>
      </div>
    </div>

    <a
      href="#experience"
      aria-label="Scroll to explore"
      className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:flex"
    >
      Scroll
      <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
    </a>
  </section>
);

/* ---------------------------------- Stats ---------------------------------- */
export const LiveStats = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    publicJson("/api/public/stats").then(setStats).catch(() => setStats(null));
  }, []);
  // Only real numbers, and only once they're meaningful; never padded.
  if (!stats || stats.athletes < 25) return null;
  const items = [
    { value: stats.athletes, label: "athletes training" },
    { value: stats.activitiesLogged, label: "workouts logged" },
    { value: stats.challengesCompleted, label: "challenges completed" },
  ];
  return (
    <section aria-label="ApeXfit in numbers" className="border-y border-white/10 py-12">
      <dl className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 text-center">
        {items.map((i) => (
          <div key={i.label}>
            <dd className="stat-number text-3xl text-foreground sm:text-5xl" data-count={i.value}>
              {i.value.toLocaleString()}
            </dd>
            <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{i.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
};

/* -------------------------------- Section head ------------------------------ */
export const SectionHead = ({ eyebrow, children, text, className }) => (
  <div className={cn("max-w-3xl", className)}>
    <p data-reveal className="eyebrow text-primary">
      {eyebrow}
    </p>
    <h2 className="mt-3 text-[clamp(2.1rem,6vw,4.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-foreground [font-stretch:82%]">
      {children}
    </h2>
    {text && (
      <p data-reveal className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {text}
      </p>
    )}
  </div>
);

export const MaskLine = ({ children, className }) => (
  <span className="block overflow-hidden pb-[0.08em]">
    <span data-mask-line className={cn("block", className)}>
      {children}
    </span>
  </span>
);

/* ------------------------------ Experience (story) -------------------------- */
const STORY = [
  {
    key: "log",
    n: "01",
    title: "Log in seconds",
    text: "Water is one tap. Steps, sleep and workouts take a few more. Everything also works offline and syncs when you reconnect.",
    panel: <LogMock />,
  },
  {
    key: "see",
    n: "02",
    title: "See where you stand",
    text: "Your day collapses into one clear view: goals, streak and progress, so you know what matters within seconds.",
    panel: <DashboardMock />,
  },
  {
    key: "improve",
    n: "03",
    title: "Know what to do next",
    text: "Your coach reads your real week and answers in plain language, with a plan sized to the time you actually have.",
    panel: <CoachMock />,
  },
];

export const Experience = () => (
  <section id="experience" data-story className="relative scroll-mt-16 border-t border-white/10 bg-background">
    {/* Desktop: pinned, scroll-driven story */}
    <div data-story-pin className="mx-auto hidden min-h-[100svh] max-w-7xl items-center px-8 pin:flex">
      <div className="grid w-full grid-cols-12 items-center gap-12">
        <div className="col-span-6">
          <SectionHead eyebrow="The experience">
            <MaskLine>One place for</MaskLine>
            <MaskLine className="text-primary">your whole day.</MaskLine>
          </SectionHead>
          <ol className="mt-12 space-y-3">
            {STORY.map((s) => (
              <li
                key={s.key}
                data-step
                className="rounded-2xl border border-transparent p-5 opacity-40 transition-[opacity,background-color,border-color] [&.is-active]:opacity-100 [&.is-active]:border-white/10 [&.is-active]:bg-white/[0.03]"
              >
                <div className="flex gap-5">
                  <span className="stat-number text-sm text-primary">{s.n}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="col-span-6">
          <div className="relative mx-auto h-[min(540px,68svh)] max-w-md">
            {STORY.map((s) => (
              <div key={s.key} data-screen className="absolute inset-0 flex items-center">
                <div className="w-full">{s.panel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Mobile / tablet: simple stacked story */}
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 pin:hidden">
      <SectionHead eyebrow="The experience">
        <MaskLine>One place for</MaskLine>
        <MaskLine className="text-primary">your whole day.</MaskLine>
      </SectionHead>
      <ol className="mt-12 space-y-14">
        {STORY.map((s) => (
          <li key={s.key} data-reveal>
            <span className="stat-number text-sm text-primary">{s.n}</span>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{s.title}</h3>
            <p className="mb-6 mt-2 text-muted-foreground">{s.text}</p>
            <div className="mx-auto max-w-sm sm:max-w-md">{s.panel}</div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

/* --------------------------------- Workouts -------------------------------- */
export const Workouts = () => (
  <section id="workouts" className="relative scroll-mt-16 overflow-hidden border-t border-white/10 py-24 sm:py-32">
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
      <div className="order-2 lg:order-1">
        <div data-scrub-panel className="mx-auto max-w-md">
          <WorkoutMock />
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <SectionHead
          eyebrow="Workout tracking"
          text="Log every set the way you actually train. ApeXfit remembers your numbers so each session starts from where you left off."
        >
          <MaskLine>Every set.</MaskLine>
          <MaskLine className="text-primary">Every rep.</MaskLine>
          <MaskLine>Every record.</MaskLine>
        </SectionHead>
        <ul data-scrub-cards className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            { icon: Dumbbell, t: "Exercise library", d: "Pick from common lifts or add your own." },
            { icon: Zap, t: "Built-in rest timer", d: "Start it from any set and keep your rhythm." },
            { icon: Medal, t: "Personal records", d: "New bests are flagged the moment you log them." },
            { icon: Target, t: "Progressive overload", d: "See each lift's trend and estimated one-rep max." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-3 font-semibold text-foreground">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* --------------------------------- Progress -------------------------------- */
const BARS = [3, 4, 2, 5, 4, 5, 6, 5];

export const Progress = () => (
  <section id="progress" className="relative scroll-mt-16 border-t border-white/10 bg-[hsl(150_22%_5.5%)] py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHead
        eyebrow="Progress"
        text="Weight, workouts, steps and sleep, charted over time so you can see what's working instead of guessing."
      >
        <MaskLine>Progress you</MaskLine>
        <MaskLine className="text-primary">can measure.</MaskLine>
      </SectionHead>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        <PanelFrame className="lg:col-span-2" label="Body weight · 8 weeks · example data" data-from="left">
          <div className="flex items-end justify-between">
            <div>
              <p className="stat-number text-4xl text-foreground sm:text-5xl">
                <Odo value="78.9" />
                <span className="ml-1 text-lg text-muted-foreground">kg</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                −<Odo value="3.5" /> kg since week 1
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Goal 75 kg</span>
          </div>
          <svg viewBox="0 0 600 200" className="mt-6 h-44 w-full sm:h-56" role="img" aria-label="Example line chart of body weight trending down over eight weeks">
            {[40, 100, 160].map((y) => (
              <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />
            ))}
            <defs>
              <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              data-area
              d="M0 30 C60 36 90 52 150 62 S240 70 300 92 S400 120 450 128 S540 150 600 158 V200 H0 Z"
              fill="url(#wfill)"
            />
            <path
              data-draw
              d="M0 30 C60 36 90 52 150 62 S240 70 300 92 S400 120 450 128 S540 150 600 158"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="600" cy="158" r="6" fill="hsl(var(--primary))" />
          </svg>
        </PanelFrame>

        <div className="grid gap-5">
          <PanelFrame label="Workouts per week · example">
            <div className="flex h-28 items-end gap-2" role="img" aria-label="Example bar chart of workouts per week, rising from three to five">
              {BARS.map((b, i) => (
                <div key={i} className="flex-1 rounded-md bg-primary/80" data-bar style={{ height: `${(b / 6) * 100}%` }} />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Up from <span className="font-semibold text-foreground">3</span> to{" "}
              <span className="font-semibold text-foreground">5</span> sessions a week.
            </p>
          </PanelFrame>
          <PanelFrame label="Goal completion · example">
            <div className="space-y-3">
              {[
                ["Steps", 84, "bg-primary"],
                ["Sleep", 92, "bg-violet-400"],
                ["Water", 75, "bg-pulse-400"],
              ].map(([n, p, c]) => (
                <div key={n}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">{n}</span>
                    <span className="stat-number text-foreground">{p}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div className={cn("h-full rounded-full", c)} data-fill style={{ width: `${p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </PanelFrame>
        </div>
      </div>
    </div>
  </section>
);

/* ----------------------------------- Coach --------------------------------- */
export const Coach = () => (
  <section id="coach" className="relative scroll-mt-16 overflow-hidden border-t border-white/10 py-24 sm:py-32">
    <div className="pointer-events-none absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-pulse-500/10 blur-[120px]" aria-hidden="true" />
    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
      <div>
        <SectionHead
          eyebrow="AI coach"
          text="Apex reads your recent steps, sleep, water, workouts and goals, so answers are about you, not a template."
        >
          <MaskLine>A coach that</MaskLine>
          <MaskLine className="text-primary">knows your week.</MaskLine>
        </SectionHead>
        <ul className="mt-9 space-y-4">
          {[
            "Workout plans sized to the time you actually have",
            "Sleep, hydration and recovery tips tied to your trends",
            "A 30-day Fitness DNA report with your next best steps",
            "Safety first: pain or injury questions point you to a professional",
          ].map((t) => (
            <li key={t} data-reveal className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              </span>
              <span className="text-foreground/90">{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">General fitness guidance, not medical advice.</p>
      </div>
      <div data-reveal-scale className="mx-auto w-full max-w-md">
        <CoachMock typing />
      </div>
    </div>
  </section>
);

/* ----------------------------- Challenges / play --------------------------- */
const PLAY = [
  { icon: Trophy, title: "Challenges", text: "Join a challenge or let the AI build one around your goals. Finish it, earn points.", tag: "Compete with yourself" },
  { icon: Flame, title: "Streaks", text: "Daily consistency, visible. Miss a day and you'll see exactly how to get back on track.", tag: "Build the habit" },
  { icon: Medal, title: "Achievements", text: "Milestones unlock as you log: first workout, hydration streaks, step records and more.", tag: "Celebrate progress" },
  { icon: Users, title: "Leaderboard", text: "See how you stack up against other athletes on the points board.", tag: "Friendly pressure" },
  { icon: ScanFace, title: "AR form check", text: "Hold a plank or wall sit and your camera checks your form live. Video never leaves your device.", tag: "Private by design" },
];

export const Play = () => (
  <section id="play" data-hscroll className="relative scroll-mt-16 border-t border-white/10 bg-[hsl(150_22%_5.5%)]">
    <div data-hscroll-pin className="flex flex-col justify-center py-24 pin:min-h-[100svh] pin:py-0">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="Challenges & motivation"
          text="Motivation fades. Systems don't. These are the parts of ApeXfit that keep you coming back."
        >
          <MaskLine>Stay in</MaskLine>
          <MaskLine className="text-primary">the game.</MaskLine>
        </SectionHead>
      </div>
      <div className="scrollbar-none mt-12 overflow-x-auto px-4 pb-4 sm:px-6 pin:overflow-visible pin:px-8">
        <ul data-hscroll-track className="flex w-max snap-x snap-mandatory gap-4 pin:gap-6 pin:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] pin:pr-16">
          {PLAY.map(({ icon: Icon, title, text, tag }, i) => (
            <li
              key={title}
              className="relative flex h-[19rem] w-[17rem] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-card p-6 sm:w-[20rem] pin:h-[23rem] pin:w-[24rem] pin:p-8"
            >
              <span className="stat-number pointer-events-none absolute -right-2 -top-6 text-[8rem] leading-none text-white/[0.04]" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow text-primary">{tag}</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-foreground pin:text-3xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* ----------------------------------- Privacy ------------------------------- */
const PRIVACY_POINTS = [
  { icon: Lock, title: "Only you can see your data", text: "Every record is locked to your account with row-level security." },
  { icon: ShieldCheck, title: "Never sold, no ads", text: "We don't sell your data or show ads. Our AI provider doesn't train on it." },
  { icon: ScanFace, title: "Camera stays on device", text: "AR form checks run in your browser. Video is never uploaded." },
  { icon: Download, title: "Export anytime", text: "Download everything you've logged in one click." },
  { icon: Trash2, title: "Delete everything", text: "Delete your account and all data permanently from Settings." },
  { icon: WifiOff, title: "Works offline", text: "Install it like an app. Logs made offline sync when you're back." },
];

export const Privacy = () => (
  <section id="privacy" className="scroll-mt-16 border-t border-white/10 py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead eyebrow="Private by design">
            <MaskLine>Your data</MaskLine>
            <MaskLine className="text-primary">stays yours.</MaskLine>
          </SectionHead>
          <Link
            to="/privacy"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Read the full privacy page <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul data-scrub-list className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:col-span-7">
          {PRIVACY_POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="bg-card p-6">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* ------------------------------------ FAQ ---------------------------------- */
const FAQS = [
  { q: "Is ApeXfit free?", a: "Yes. Every feature described on this page is free to use, with no credit card and no trial clock." },
  { q: "Do I need a smartwatch or fitness tracker?", a: "No. Log steps, sleep, water and workouts by hand in a few taps. The AR challenges only need your phone or laptop camera." },
  { q: "Is the AI coach a doctor?", a: "No. It gives general fitness, nutrition and sleep guidance based on your logs. For pain, injuries or medical conditions it tells you to see a qualified professional." },
  { q: "What happens to my data?", a: "It's stored securely and only your account can read it. When you message the coach, the relevant context is sent to our AI provider (Groq) just to write the reply; they don't use it to train models." },
  { q: "Can I use it on my phone?", a: "Yes. It's built mobile-first. Open it in your phone's browser and choose Add to Home Screen to install it like a native app." },
  { q: "Can I delete my account?", a: "Anytime, from Settings. It permanently deletes your account and everything you've logged. You can export a copy first." },
];

export const Faq = () => (
  <section id="faq" className="scroll-mt-16 border-t border-white/10 bg-[hsl(150_22%_5.5%)] py-24 sm:py-32">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <SectionHead eyebrow="FAQ" className="mx-auto text-center">
        <MaskLine>Questions,</MaskLine>
        <MaskLine className="text-primary">answered.</MaskLine>
      </SectionHead>
      <Accordion type="single" collapsible className="mt-12">
        {FAQS.map(({ q, a }) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

/* --------------------------------- Final CTA ------------------------------- */
export const FinalCta = () => (
  <section className="relative overflow-hidden border-t border-white/10 py-28 sm:py-40">
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div data-orb data-speed="0.2" className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
    </div>
    <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
      <h2 className="text-[clamp(2.6rem,9.5vw,7rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-foreground [font-stretch:80%]">
        <MaskLine>Your next session</MaskLine>
        <MaskLine className="text-primary">starts here.</MaskLine>
      </h2>
      <p data-reveal className="mx-auto mt-7 max-w-lg text-lg text-muted-foreground">
        Free to use. Set up in a minute. Your first goal can be done before tonight.
      </p>
      <div data-reveal className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="sm:min-w-[240px]">
          <Link to="/register">
            Create your free account <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/login">I already have an account</Link>
        </Button>
      </div>
    </div>
  </section>
);

export const LandingFooter = () => (
  <footer className="border-t border-white/10">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-full" />
        <Wordmark />
        <span className="text-sm text-muted-foreground">· Train smarter, every day.</span>
      </div>
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
        <a href="#experience" className="text-muted-foreground hover:text-foreground">Experience</a>
        <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
        <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
        <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>
      </nav>
      <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ApeXfit</p>
    </div>
  </footer>
);

