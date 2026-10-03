// frontend/src/pages/Landing.jsx
// Public marketing page for signed-out visitors. Always dark and cinematic. Everything stated here
// is true of the product; numbers inside mock panels are labelled "example" and nothing is invented.
// Motion lives in this one GSAP context: all of it is inside matchMedia("no-preference"), so users
// who prefer reduced motion get the same page as static content, and every tween is reverted on unmount.
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Coach,
  Experience,
  Faq,
  FinalCta,
  Hero,
  LandingFooter,
  LandingHeader,
  LiveStats,
  Play,
  Privacy,
  Progress,
  Workouts,
} from "@/components/Landing/Sections";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const formatCount = (value, decimals) =>
  decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString();

const Landing = () => {
  const root = useRef(null);

  useEffect(() => {
    document.title = "ApeXfit · Intelligent fitness tracker with an AI coach";
  }, []);

  useGSAP(
    () => {
      const q = (sel) => gsap.utils.toArray(sel);
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px) and (min-height: 540px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop } = context.conditions;

          /* ---- Hero entrance ---- */
          const heroPath = root.current.querySelector("[data-hero] [data-draw]");
          const heroLen = heroPath?.getTotalLength?.() || 0;
          if (heroPath) gsap.set(heroPath, { strokeDasharray: heroLen, strokeDashoffset: heroLen });

          const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
          intro
            .from("[data-hero-line]", { yPercent: 115, duration: 1.1, stagger: 0.12 })
            .from("[data-hero-fade]", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, "-=0.7")
            .from("[data-hero-panel]", { y: 70, autoAlpha: 0, scale: 0.96, duration: 1.1, stagger: 0.15 }, "-=0.9");
          if (heroPath) intro.to(heroPath, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, 0.3);

          /* ---- Parallax on glows and floating panels ---- */
          q("[data-speed]").forEach((el) => {
            const speed = parseFloat(el.dataset.speed) || 0;
            gsap.fromTo(
              el,
              { y: -speed * 160 },
              {
                y: speed * 160,
                ease: "none",
                scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true },
              }
            );
          });

          /* ---- Generic reveals ---- */
          q("[data-reveal]").forEach((el) => {
            gsap.from(el, {
              y: 32,
              autoAlpha: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 82%", once: true },
            });
          });
          q("[data-reveal-scale]").forEach((el) => {
            gsap.from(el, {
              y: 70,
              scale: 0.93,
              autoAlpha: 0,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 82%", once: true },
            });
          });

          /* ---- Headline mask reveals ---- */
          q("h2").forEach((heading) => {
            const lines = heading.querySelectorAll("[data-mask-line]");
            if (!lines.length) return;
            gsap.from(lines, {
              yPercent: 115,
              duration: 1,
              ease: "power4.out",
              stagger: 0.12,
              scrollTrigger: { trigger: heading, start: "top 82%", once: true },
            });
          });

          /* ---- Charts: line draw, bars, fills, rings ---- */
          q("[data-draw]")
            .filter((path) => !path.closest("[data-hero]"))
            .forEach((path) => {
              const len = path.getTotalLength();
              const svg = path.closest("svg");
              const tl = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: { trigger: svg, start: "top 92%", end: "top 45%", scrub: 0.5 },
              });
              tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1 });
              const area = svg.querySelector("[data-area]");
              if (area) tl.from(area, { autoAlpha: 0, duration: 0.6 }, 0.4);
            });
          q("[data-bar]").forEach((bar, i) => {
            gsap.from(bar, {
              scaleY: 0,
              transformOrigin: "bottom",
              duration: 1.6,
              ease: "elastic.out(1, 0.55)",
              delay: (i % 8) * 0.12,
              scrollTrigger: { trigger: bar, start: "top 82%", once: true },
            });
          });
          q("[data-fill]").forEach((fill) => {
            gsap.from(fill, {
              scaleX: 0,
              transformOrigin: "left",
              duration: fill.hasAttribute("data-slow") ? 2.6 : 1.4,
              delay: fill.hasAttribute("data-slow") ? 0.3 : 0,
              ease: "power2.out",
              scrollTrigger: { trigger: fill, start: "top 82%", once: true },
            });
          });
          q("[data-ring]").forEach((ring) => {
            gsap.fromTo(
              ring,
              { strokeDashoffset: Number(ring.dataset.circ) },
              {
                strokeDashoffset: Number(ring.dataset.target),
                duration: 2.8,
                delay: 0.3,
                ease: "power2.out",
                scrollTrigger: { trigger: ring, start: "top 82%", once: true },
              }
            );
          });

          /* ---- Count-up numbers (84%, 8,412, 7.4 h, 6 / 8, 01:30 ...) ---- */
          q("[data-countup]").forEach((el) => {
            const text = el.dataset.countup;
            const clock = text.match(/^(\d+):(\d{2})$/);
            const parts = [...text.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => ({
              raw: m[0],
              value: parseFloat(m[0].replace(/,/g, "")),
              decimals: (m[0].split(".")[1] || "").length,
              grouped: m[0].includes(","),
            }));
            if (!clock && !parts.length) return;
            const state = { t: 0 };
            const render = (t) => {
              if (clock) {
                const total = Math.round((Number(clock[1]) * 60 + Number(clock[2])) * t);
                el.textContent = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                return;
              }
              let i = 0;
              el.textContent = text.replace(/\d[\d,]*\.?\d*/g, () => {
                const p = parts[i++];
                const v = p.value * t;
                return p.decimals ? v.toFixed(p.decimals) : p.grouped ? Math.round(v).toLocaleString("en-US") : String(Math.round(v));
              });
            };
            render(0);
            gsap.to(state, {
              t: 1,
              duration: 2.2,
              ease: "power2.out",
              onUpdate: () => render(state.t),
              onComplete: () => {
                el.textContent = text;
              },
              scrollTrigger: { trigger: el, start: "top 82%", once: true },
            });
          });

          /* ---- Progress: panels fly in from different sides with a springy settle ---- */
          q("#progress .grid > *").forEach((el, i) => {
            gsap.from(el, {
              y: 90,
              x: i === 0 ? -80 : 80,
              rotateX: 14,
              transformPerspective: 900,
              scale: 0.92,
              autoAlpha: 0,
              duration: 1.5,
              ease: "back.out(1.3)",
              scrollTrigger: { trigger: el, start: "top 82%", once: true },
            });
          });

          /* ---- Workout tracking: set rows type in one by one, the PR badge pops last ---- */
          q("[data-scrub-panel]").forEach((panel) => {
            const rows = panel.querySelectorAll("[data-row]");
            const pop = panel.querySelector("[data-pop]");
            const tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 88%", end: "top 35%", scrub: 0.5 } });
            tl.from(rows, { x: -60, autoAlpha: 0, stagger: 0.25, ease: "none", duration: 1 });
            if (pop) tl.from(pop, { scale: 0, rotate: -25, ease: "back.out(3)", duration: 0.6 }, ">");
          });

          /* ---- Scrubbed entrances: workout panel and privacy cards follow the scroll ---- */
          q("[data-scrub-list]").forEach((list) => {
            const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: "top 92%", end: "top 40%", scrub: 0.5 } });
            tl.from(list.children, {
              rotationX: -80,
              y: 60,
              autoAlpha: 0,
              transformPerspective: 800,
              transformOrigin: "top center",
              stagger: 0.18,
              ease: "none",
            });
            tl.from(list.querySelectorAll("svg"), { scale: 0, rotate: -90, stagger: 0.18, ease: "back.out(2)" }, 0.1);
          });
          q("[data-scrub-cards]").forEach((list) => {
            gsap.from(list.children, {
              x: -60, autoAlpha: 0, stagger: 0.2, ease: "none",
              scrollTrigger: { trigger: list, start: "top 92%", end: "top 40%", scrub: 0.5 },
            });
          });

          /* ---- Number counters ---- */
          q("[data-count]").forEach((el) => {
            const target = parseFloat(el.dataset.count);
            const decimals = Number(el.dataset.decimals || 0);
            const state = { value: 0 };
            el.textContent = formatCount(0, decimals);
            gsap.to(state, {
              value: target,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = formatCount(state.value, decimals);
              },
              onComplete: () => {
                el.textContent = formatCount(target, decimals);
              },
              scrollTrigger: { trigger: el, start: "top 82%", once: true },
            });
          });

          /* ---- Pinned story (desktop): scroll swaps the product screen ---- */
          if (desktop) {
            const pin = root.current.querySelector("[data-story-pin]");
            const screens = q("[data-screen]");
            const steps = q("[data-step]");
            if (pin && screens.length === 3) {
              gsap.set(screens.slice(1), { autoAlpha: 0, y: 60, scale: 0.95 });
              steps[0]?.classList.add("is-active");
              const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                scrollTrigger: {
                  trigger: pin,
                  start: "top top",
                  end: "+=240%",
                  pin: true,
                  scrub: 0.6,
                  anticipatePin: 1,
                  onUpdate: (self) => {
                    const active = Math.min(2, Math.floor(self.progress * 3));
                    steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
                  },
                },
              });
              tl.to(screens[0], { autoAlpha: 0, y: -60, scale: 0.95, duration: 1 }, 1)
                .to(screens[1], { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, 1)
                .to(screens[1], { autoAlpha: 0, y: -60, scale: 0.95, duration: 1 }, 2)
                .to(screens[2], { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, 2)
                .to({}, { duration: 0.6 }, 3);
            }

            /* ---- Horizontal scroll (desktop): challenges track ---- */
            const hPin = root.current.querySelector("[data-hscroll-pin]");
            const track = root.current.querySelector("[data-hscroll-track]");
            if (hPin && track) {
              gsap.to(track, {
                x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
                ease: "none",
                scrollTrigger: {
                  trigger: hPin,
                  start: "top top",
                  end: () => `+=${Math.max(0, track.scrollWidth - window.innerWidth)}`,
                  pin: true,
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                  anticipatePin: 1,
                },
              });
            }
          }
        }
      );

      // Pins add scroll distance, so trigger positions below them must be recalculated in page order;
      // otherwise lower animations fire early, before the visitor has reached them.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      // Counters keep their final value when motion is reduced (markup already holds it).
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} id="top" className="dark min-h-dvh bg-background text-foreground [color-scheme:dark]">
      <a href="#main" className="btn-primary sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100]">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <LiveStats />
        <Experience />
        <Workouts />
        <Progress />
        <Coach />
        <Play />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
