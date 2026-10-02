// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lists every built file for the service worker to precache (so all pages work
 * offline), except the large TensorFlow chunks that only the AR page needs.
 * Also stamps sw.js with a build id so each deploy installs a fresh cache.
 */
const precacheManifest = () => {
  let files = [];
  return {
    name: "apexfit-precache-manifest",
    apply: "build",
    generateBundle(_options, bundle) {
      files = Object.values(bundle)
        .filter(
          (file) =>
            !(file.type === "chunk" && Object.keys(file.modules).some((id) => id.includes("@tensorflow")))
        )
        .map((file) => `/${file.fileName}`)
        .filter((name) => name !== "/index.html");
      this.emitFile({ type: "asset", fileName: "precache-manifest.json", source: JSON.stringify(files) });
    },
    writeBundle(options) {
      const swPath = resolve(options.dir, "sw.js");
      if (!existsSync(swPath)) return;
      const buildId = createHash("sha256").update(files.join("|")).digest("hex").slice(0, 10);
      writeFileSync(swPath, readFileSync(swPath, "utf8").replaceAll("__BUILD_ID__", buildId));
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), precacheManifest()],
  server: {
    host: true, // This allows access from your local network IP
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
