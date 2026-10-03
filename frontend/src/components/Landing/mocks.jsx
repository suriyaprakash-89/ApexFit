// Illustrative product previews used on the landing page. They are built from the same
// UI language as the real app and labelled "Example" wherever numbers appear.
import React from "react";
import { Brain, Droplets, Flame, Footprints, Moon, Plus, Trophy, Dumbbell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Number that counts up on scroll. Markup holds the final value (static for reduced motion);
 *  GSAP animates it in Landing.jsx via [data-countup]. */
export const Odo = ({ value }) => <span data-countup={value}>{value}</span>;

const Ring = ({ pct, size = 64, stroke = 6, color = "hsl(var(--primary))", children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          data-ring
          data-circ={c}
          data-target={c * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

export const PanelFrame = ({ className, children, label, ...rest }) => (
  <div
    {...rest}
    aria-hidden="true"
    className={cn(
      "relative overflow-hidden rounded-3xl border border-white/10 bg-card/90 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-5",
      className
    )}
  >
    {label && <p className="eyebrow mb-3">{label}</p>}
    {children}
  </div>
);

export const DashboardMock = ({ className }) => (
  <PanelFrame className={className} label="Today · example">
    <div className="flex items-center gap-4">
      <Ring pct={84} size={84} stroke={8}>
        <div className="text-center leading-none">
          <p className="stat-number text-xl text-foreground"><Odo value="84%" /></p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">of goals</p>
        </div>
      </Ring>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-tight text-foreground">Strong morning.</p>
        <p className="text-xs text-muted-foreground">3 of 4 daily goals on track</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ember-500/15 px-2.5 py-1 text-[11px] font-semibold text-ember-400">
          <Flame className="h-3 w-3" /> 6-day streak
        </span>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2.5">
      {[
        { icon: Footprints, label: "Steps", value: "8,412", pct: 84, color: "hsl(var(--primary))" },
        { icon: Flame, label: "Active cal", value: "420", pct: 84, color: "#ff8a4c" },
        { icon: Moon, label: "Sleep", value: "7.4 h", pct: 92, color: "#a78bfa" },
        { icon: Droplets, label: "Water", value: "6 / 8", pct: 75, color: "#4cc9f0" },
      ].map(({ icon: Icon, label, value, pct, color }) => (
        <div key={label} className="rounded-2xl border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <Icon className="h-4 w-4" style={{ color }} />
            <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
          </div>
          <p className="stat-number mt-2 text-lg text-foreground"><Odo value={value} /></p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
            <div className="h-1 rounded-full" data-fill data-slow style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  </PanelFrame>
);

export const LogMock = ({ className }) => (
  <PanelFrame className={className} label="Quick log · example">
    <div className="space-y-2.5">
      {[
        { icon: Droplets, label: "Water", sub: "6 of 8 glasses", color: "#4cc9f0", action: "+1" },
        { icon: Footprints, label: "Steps", sub: "Synced 2 min ago", color: "hsl(var(--primary))", action: "8,412" },
        { icon: Moon, label: "Sleep", sub: "Last night", color: "#a78bfa", action: "7.4 h" },
        { icon: Dumbbell, label: "Workout", sub: "Push day · 52 min", color: "#ff8a4c", action: "Log" },
      ].map(({ icon: Icon, label, sub, color, action }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </div>
          <span className="inline-flex min-w-[52px] items-center justify-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold text-primary">
            {action === "+1" && <Plus className="h-3 w-3" />}
            {action}
          </span>
        </div>
      ))}
    </div>
  </PanelFrame>
);

export const CoachMock = ({ className, typing }) => (
  <PanelFrame className={className}>
    <div className="-mx-1 mb-3 flex items-center gap-3 border-b border-border pb-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pulse-500/15 ring-1 ring-pulse-500/40">
        <Brain className="h-4 w-4 text-pulse-400" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Apex · AI Coach</p>
        <p className="text-[11px] text-muted-foreground">Uses your last 7 days · example</p>
      </div>
    </div>
    <div className="space-y-3 text-sm">
      <div className="flex justify-end">
        <p className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground">
          I keep missing my workouts. What should I change?
        </p>
      </div>
      <div className="flex gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pulse-500/15">
          <Brain className="h-3.5 w-3.5 text-pulse-400" />
        </span>
        <div className="max-w-[88%] space-y-2 rounded-2xl rounded-tl-md bg-secondary px-3.5 py-2.5 text-secondary-foreground" data-coach-reply>
          <p>
            You logged <strong>2 workouts</strong> this week, both on weekends. Let&apos;s make weekdays easier:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              Book two <strong>20-minute</strong> sessions, Tue and Thu
            </li>
            <li>Lay out your shoes the night before</li>
            <li>Join a 5-day challenge for accountability</li>
          </ul>
        </div>
      </div>
      {typing && (
        <div className="flex gap-1 pl-9" data-typing>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      )}
    </div>
  </PanelFrame>
);

export const WorkoutMock = ({ className }) => (
  <PanelFrame className={className}>
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="font-display text-lg font-bold text-foreground">Push day</p>
        <p className="text-xs text-muted-foreground">Example session · 52 min</p>
      </div>
      <span data-pop className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
        <Trophy className="h-3 w-3" /> New PR
      </span>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-[1.6fr_.6fr_.6fr_.8fr] gap-2 bg-muted px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Exercise</span>
        <span className="text-right">Set</span>
        <span className="text-right">Reps</span>
        <span className="text-right">Weight</span>
      </div>
      {[
        ["Bench press", "1", "8", "70 kg"],
        ["Bench press", "2", "8", "72.5 kg"],
        ["Bench press", "3", "6", "75 kg", true],
        ["Overhead press", "1", "10", "40 kg"],
        ["Overhead press", "2", "9", "40 kg"],
      ].map(([name, set, reps, kg, pr], i) => (
        <div key={i} data-row className="grid grid-cols-[1.6fr_.6fr_.6fr_.8fr] items-center gap-2 border-t border-border px-3 py-2.5 text-sm">
          <span className="truncate text-foreground">{name}</span>
          <span className="stat-number text-right text-muted-foreground">{set}</span>
          <span className="stat-number text-right text-foreground">{reps}</span>
          <span className={cn("stat-number text-right", pr ? "text-primary" : "text-foreground")}>{kg}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
      <div>
        <p className="eyebrow">Rest timer</p>
        <p className="stat-number text-2xl text-foreground"><Odo value="01:30" /></p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-4 w-4" />
      </span>
    </div>
  </PanelFrame>
);
