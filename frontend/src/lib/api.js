// frontend/src/lib/api.js
import { supabase } from "./supabase";
import { localDate } from "../utils/date";

export const API_URL = import.meta.env.VITE_API_URL;

/** fetch() against our backend with the user's access token attached. */
export async function apiFetch(path, { headers, ...options } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("You are signed out. Please sign in again.");

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...headers,
      },
    });
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

/** Query string helper that always includes the user's local date. */
export const withClientDate = (params = {}) =>
  new URLSearchParams({ clientDate: localDate(), ...params }).toString();
