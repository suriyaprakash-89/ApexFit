// backend/lib/http.js
// Shared response helpers: log the real error on the server, send a safe message to the client.

const sendServerError = (res, error, publicMessage = "Something went wrong. Please try again.") => {
  console.error(`[${res.req?.method} ${res.req?.originalUrl}]`, error);
  res.status(500).json({ error: publicMessage });
};

const sendBadRequest = (res, message) => res.status(400).json({ error: message });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (value) => typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

/** Number within [min, max], or null if missing/invalid. */
const toNumber = (value, { min = -Infinity, max = Infinity, integer = false } = {}) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return NaN;
  return integer ? Math.round(n) : n;
};

module.exports = { sendServerError, sendBadRequest, isDate, toNumber };
