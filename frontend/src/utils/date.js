// frontend/src/utils/date.js
// All "today" logic uses the user's LOCAL calendar date. Never use
// toISOString() for this: it is UTC and is a day behind for users east of UTC
// in the early morning (e.g. India between 00:00 and 05:30).

const pad = (n) => String(n).padStart(2, "0");

/** Local date as "YYYY-MM-DD". */
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Parse "YYYY-MM-DD" as a LOCAL date (new Date("YYYY-MM-DD") would be UTC). */
export const parseLocalDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Format a "YYYY-MM-DD" (or Date) for display without timezone shifts. */
export const formatDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
  const date = parseLocalDate(value);
  return date ? date.toLocaleDateString(undefined, options) : "";
};

export const isToday = (value) => String(value).slice(0, 10) === localDate();

export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const formatRelativeTime = (timestamp) => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};
