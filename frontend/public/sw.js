// public/sw.js - offline support: precache the app shell and every page chunk.
// The build id placeholder below is replaced at build time (see vite.config.js),
// so each deploy installs a fresh cache.
const CACHE = "apexfit-__BUILD_ID__";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/logo.png"];

const precache = async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  try {
    const files = await (await fetch("/precache-manifest.json", { cache: "no-store" })).json();
    // One failed file shouldn't stop the rest from caching
    await Promise.allSettled(files.map((file) => cache.add(file)));
  } catch {
    // No manifest (e.g. dev build): assets are still cached as they're used
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never cache API/Supabase calls

  // Pages: network first, fall back to the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  // Hashed build assets and icons: cache first.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
