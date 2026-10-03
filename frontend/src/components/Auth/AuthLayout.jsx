// frontend/src/components/Auth/AuthLayout.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, EyeOff } from "lucide-react";

const HIGHLIGHTS = ["Workouts, steps, sleep and water in one place", "An AI coach that reads your real week", "Goals, streaks and challenges that keep you going"];

const BrandPanel = () => (
  <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16" aria-hidden="true">
    <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
    <div className="pointer-events-none absolute -bottom-40 right-0 h-[26rem] w-[26rem] rounded-full bg-pulse-500/15 blur-[120px]" />
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(70% 60% at 30% 30%, black, transparent 80%)",
        WebkitMaskImage: "radial-gradient(70% 60% at 30% 30%, black, transparent 80%)",
      }}
    />
    <Link to="/" className="relative flex items-center gap-2.5">
      <img src="/logo.png" alt="" className="h-10 w-10 rounded-full ring-1 ring-white/15" />
      <span className="font-display text-2xl font-extrabold tracking-tight">
        Ape<span className="text-primary">X</span>fit
      </span>
    </Link>
    <div className="relative">
      <h2 className="text-[clamp(2.5rem,4.2vw,4.25rem)] font-black uppercase leading-[0.92] tracking-[-0.02em] [font-stretch:80%]">
        Train with
        <br />
        <span className="text-primary">intent.</span>
      </h2>
      <ul className="mt-8 space-y-3">
        {HIGHLIGHTS.map((t) => (
          <li key={t} className="flex items-center gap-3 text-muted-foreground">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {t}
          </li>
        ))}
      </ul>
    </div>
    <p className="relative text-xs text-muted-foreground">Private by design. Export or delete your data anytime.</p>
  </aside>
);

export const AuthLayout = ({ title, subtitle, children, footer }) => {
  useEffect(() => {
    document.title = `${title} · ApeXfit`;
  }, [title]);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <BrandPanel />
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden" aria-label="ApeXfit home">
            <img src="/logo.png" alt="" className="h-12 w-12 rounded-full ring-1 ring-border" />
            <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Ape<span className="text-primary">X</span>fit
            </span>
          </Link>
          <div className="card !p-6 sm:!p-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export const PasswordInput = ({ id, label, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input id={id} type={visible ? "text" : "password"} className="input-field pr-12" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);
