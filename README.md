# ApeXfit

A full-stack fitness tracking application built with React, Node.js, and Supabase.

## Features

- User authentication with email/password and Google
- Activity tracking (workouts, steps, sleep, water intake), with offline logging that syncs later
- **Workout logging**: exercises, sets, reps, weight, rest timer, personal records and strength progression
- **Body tracking**: weight, body fat and tape measurements with BMI and goal progress
- Goal setting and live progress tracking, daily streak
- AI health coach (streaming, uses your recent data) and 30-day Fitness DNA report
- Challenges, achievements, points and an AR form-check page
- Interactive charts and analytics
- Admin panel for user management
- Dark/light mode, responsive layout, installable PWA

## Tech Stack

- Frontend: React + Vite + TailwindCSS + shadcn/ui (Radix) + GSAP + Zustand + Chart.js
- Backend: Node.js + Express.js (Groq for the AI coach)
- Database & Auth: Supabase (PostgreSQL)
- Deployment: Vercel/Netlify + Supabase Cloud

## Design system

- Tokens (colours, radius) live in `frontend/src/index.css` as CSS variables; the Tailwind `gray` and
  `primary` scales in `tailwind.config.js` are mapped to the brand (graphite + "volt" lime), so legacy utility
  classes follow the theme automatically.
- shadcn/ui components are in `frontend/src/components/shadcn` (alias `@/components/shadcn`, see `components.json`).
  The folder is not called `ui` because `components/UI` already exists and Windows paths are case-insensitive.
- Toasts: `import toast from "@/lib/toast"` (Sonner).
- The landing page (`pages/Landing.jsx`, `components/Landing/`) uses GSAP + ScrollTrigger. All motion runs inside
  `gsap.matchMedia` for `prefers-reduced-motion: no-preference`, and is reverted on unmount.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Database

Apply every file in `supabase/migrations` (for example `supabase db push`). Workouts and body tracking need
`0007_workouts_body_metrics.sql`; until it is applied those two pages show a setup notice and everything else keeps working.

The backend must be given the **service_role** key (`SUPABASE_SERVICE_KEY` in `backend/.env`). With a publishable/anon
key, server-side features (AI history and context, goal progress, leaderboard, account deletion) silently see no data.

### Running locally

```bash
npm --prefix frontend run dev        # https (self-signed cert, needed for camera access over the LAN)
npm --prefix frontend run dev:http   # plain http, e.g. for automated browsers that reject the cert
npm --prefix backend start
```

In dev only, `/preview/landing` shows the marketing page even while signed in.
