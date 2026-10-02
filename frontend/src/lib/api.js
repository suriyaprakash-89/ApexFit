// frontend/src/lib/api.js
import { supabase } from "./supabase";
import { localDate } from "../utils/date";

export const API_URL = import.meta.env.VITE_API_URL;

const send = (path, token, { headers, ...options }) =>
  fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  });

/** fetch() against our backend with the user's access token attached. */
export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("You are signed out. Please sign in again.");

  try {
    let response = await send(path, session.access_token, options);
    // Expired token: refresh the session once and retry the request
    if (response.status === 401) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) response = await send(path, data.session.access_token, options);
    }
    return response;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
}

/** apiFetch + JSON parsing + readable errors. */
export async function apiJson(path, options) {
  const response = await apiFetch(path, options);
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

/** Minutes east of UTC, e.g. 330 for India. */
export const tzOffset = () => -new Date().getTimezoneOffset();

/** Query string helper that always includes the user's local date and timezone. */
export const withClientDate = (params = {}) =>
  new URLSearchParams({ clientDate: localDate(), tzOffset: String(tzOffset()), ...params }).toString();

/** Public (no sign-in) endpoints, e.g. landing page stats. */
export async function publicJson(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
