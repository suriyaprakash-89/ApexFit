// frontend/src/store/syncStore.js
// Offline logging: writes made without a connection are kept on the device and
// replayed in order when the connection comes back.
import { create } from "zustand";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "apexfit-offline-queue-v1";

const loadQueue = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full/unavailable: the op stays in memory for this session
  }
};

let queue = loadQueue();

export const newClientId = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );

/** Supabase reports a lost connection as an error object, not a thrown exception. */
export const isNetworkError = (error) =>
  (typeof navigator !== "undefined" && !navigator.onLine) ||
  /failed to fetch|networkerror|load failed|network request failed/i.test(error?.message || "");

/**
 * Errors worth retrying later instead of discarding the user's data: no connection,
 * or an expired/invalid session (e.g. offline for days); those succeed after re-sign-in.
 */
const isRetryableError = (error) =>
  isNetworkError(error) ||
  /^PGRST30/.test(error?.code || "") ||
  /jwt|token|unauthori[sz]ed/i.test(`${error?.message || ""} ${error?.details || ""}`);

/** Run one queued operation against Supabase. Throws on failure. */
async function execute(op) {
  let request;
  if (op.kind === "upsert") {
    request = supabase.from(op.table).upsert(op.payload, { onConflict: op.onConflict }).select().single();
  } else if (op.kind === "rpc") {
    request = supabase.rpc(op.fn, op.payload);
  } else {
    throw new Error(`Unknown offline op: ${op.kind}`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

const currentUserId = async () => (await supabase.auth.getSession()).data.session?.user?.id;

export const useSyncStore = create((set, get) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pending: queue.length,
  syncing: false,

  setOnline: (online) => set({ online }),

  enqueue: (op) => {
    queue = [...queue, { ...op, queuedAt: Date.now() }];
    saveQueue(queue);
    set({ pending: queue.length });
  },

  /** Replay queued writes for the signed-in user. Returns how many were saved. */
  flush: async ({ onSynced } = {}) => {
    if (get().syncing || !queue.length || !navigator.onLine) return 0;
    const userId = await currentUserId();
    if (!userId) return 0;

    set({ syncing: true });
    let synced = 0;
    let dropped = 0;
    let retryLater = false;
    try {
      for (const op of [...queue]) {
        if (op.userId !== userId) continue; // another account's changes wait for that user
        try {
          await execute(op);
          synced += 1;
        } catch (error) {
          if (isRetryableError(error)) {
            retryLater = true;
            break; // keep this and every later op, in order
          }
          console.error("Dropping offline change that the server rejected:", op, error);
          dropped += 1;
        }
        queue = queue.filter((q) => q !== op);
        saveQueue(queue);
        set({ pending: queue.length });
      }
    } finally {
      set({ syncing: false });
    }

    if (synced) {
      toast.success(`Synced ${synced} offline change${synced > 1 ? "s" : ""}`);
      onSynced?.();
    }
    if (dropped) toast.error(`${dropped} offline change${dropped > 1 ? "s" : ""} couldn't be saved`);
    if (retryLater && navigator.onLine) {
      toast("Some offline changes are still waiting. We'll retry shortly.", { icon: "⏳", id: "sync-retry" });
    }
    return synced;
  },
}));

/**
 * Write now if possible, otherwise queue for later.
 * Ops: { kind: "upsert", table, payload, onConflict } | { kind: "rpc", fn, payload }
 * Upserts must be idempotent (natural key or client-generated id) so a replay can't duplicate.
 * Returns { queued, data }.
 */
export async function runOrQueue(op) {
  const userId = await currentUserId();
  if (!userId) throw new Error("You are signed out. Please sign in again.");
  const queued = { ...op, userId };

  if (!navigator.onLine) {
    useSyncStore.getState().enqueue(queued);
    return { queued: true, data: op.payload };
  }
  try {
    return { queued: false, data: await execute(queued) };
  } catch (error) {
    if (!isRetryableError(error)) throw error;
    useSyncStore.getState().enqueue(queued);
    return { queued: true, data: op.payload };
  }
}

export const offlineSavedToast = () =>
  toast("Saved on this device. It will sync when you're back online.", { icon: "📴" });
