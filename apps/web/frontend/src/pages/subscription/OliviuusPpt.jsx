import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Maximize, Minimize, Play, Pause, Settings } from "lucide-react";
import Logo from "../../components/Logo";

export default function OliviuusInvestorPitch() {
  const [index, setIndex] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const slides = [
    {
      id: "cover",
      title: "Oliviuus — Rwandan Streaming Platform",
      subtitle: "Local-first streaming: Kinyarwanda-first content, community growth, and scalable distribution",
      bullets: [
        "Target: Rwanda + regional expansion (Kinyarwanda first)",
        "Licensed content model: Netflix-style content acquisition and distribution",
        "Built with modern stack for quick iteration and low-cost scaling"
      ],
      notes: "Start by greeting investors, set the scene: why local-focus matters and how global players miss local nuances. Mention content licensing strategy."
    },
    {
      id: "problem",
      title: "Problem — Local Content & Distribution Gap",
      bullets: [
        "Limited local-language content on global platforms",
        "Poor payment options tuned to Rwandan users (mobile money-first needed)",
        "Creators lack professional distribution channels"
      ],
      notes: "Emphasize user pain: discovery, payment friction, and professional distribution needs."
    },
    {
      id: "opportunity",
      title: "Market Opportunity — Why Rwanda & the Region",
      bullets: [
        "Favorable mobile-first adoption and rapid data access growth",
        "Under-served by major streaming services who favor global content",
        "Opportunity to build the premier local streaming brand with licensed content partnerships"
      ],
      notes: "Focus on qualitative advantage: cultural fit, easier acquisition, licensed content partnerships."
    },
    {
      id: "product",
      title: "Product — What Oliviuus Delivers",
      bullets: [
        "Curated library of Rwandan movies, short films, and series (Kinyarwanda-first)",
        "Professional content licensing and distribution agreements",
        "Flexible billing: MTN/Mobile Money, Airtel, card, and agent-assisted payments"
      ],
      notes: "Show screenshots or a short live demo here. Highlight our licensed content approach."
    },
    {
      id: "compare",
      title: "Competitive Positioning — How We Differ",
      bullets: [
        "Global platforms: international catalog, higher CAC, standardized content strategy",
        "Oliviuus: local-first curation, lower CAC via telco & community channels, licensed content focus",
        "Professional partnerships and content licensing agreements"
      ],
      notes: "Focus on differentiation through local expertise and licensed content partnerships."
    },
    {
      id: "business-model",
      title: "Business Model & Revenue Streams",
      bullets: [
        "Subscription tiers with telco carrier-billing integration",
        "Licensed content distribution to regional partners",
        "Strategic content partnerships and platform licensing"
      ],
      notes: "Explain our licensed content approach and subscription focus."
    },
    {
      id: "go-to-market",
      title: "Go-to-Market Strategy",
      bullets: [
        "Partnerships with telcos (co-marketing & unified billing)",
        "Content licensing agreements with local studios and producers",
        "Community-driven growth: influencers, campus programs, and strategic partnerships"
      ],
      notes: "Show timeline: 0-6 months: content partnerships; 6-18 months: scale; 18-36 months: regional expansion."
    },
    {
      id: "traction",
      title: "Traction & Roadmap",
      bullets: [
        "Platform built (React + Node + MySQL), initial content partnerships secured",
        "Roadmap: enhanced payments integration, analytics, offline downloads, and expanded content library",
        "KPIs to watch: MRR, CAC, LTV, churn, content partnership growth"
      ],
      notes: "Be honest about what's built and what's planned. Investors want realism."
    },
    {
      id: "ask",
      title: "Funding Ask & Use of Funds",
      bullets: [
        "Seeking Rwf 15+M seed to: accelerate content licensing, platform enhancement and hire key team members",
        "Planned runway: 2-5 months to reach key KPI milestones",
        "Milestones: 50k MAU, 10+ content partnerships, sustainable ARPU"
      ],
      notes: "Tailor ask to your real numbers — the example is illustrative. Show clear milestones and KPIs."
    },
    {
      id: "team",
      title: "Team & Strategic Advantage",
      bullets: [
        "Founders: product, engineering, and content partnership expertise",
        "Advisors: telco payment specialists and entertainment industry leaders",
        "Local presence provides cultural knowledge and partnership access"
      ],
      notes: "Introduce the core team by name during the live presentation. Keep bios short and relevant."
    },
    {
      id: "contact",
      title: "Next Steps & Partnership Opportunities",
      bullets: [
        "Demo the platform, follow up with detailed documentation, and schedule partner meetings",
        "Open to strategic investors who bring content partnership value",
        "Thank you — questions?"
      ],
      notes: "End with a strong call to action: request a content partnership discussion or strategic introduction."
    }
  ];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key.toLowerCase() === "n") setPresenterMode((p) => !p);
      if (e.key.toLowerCase() === "p") setPlaying((p) => !p);
      if (e.key === "Home") goTo(0);
      if (e.key === "End") goTo(slides.length - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, 6000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!isFullscreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function fsChange() {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
    }
    document.addEventListener("fullscreenchange", fsChange);
    return () => document.removeEventListener("fullscreenchange", fsChange);
  }, []);

  function next() {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function goTo(i) {
    setIndex(i);
  }

  function Bullets({ items }) {
    return (
      <ul className="mt-6 space-y-3 list-inside list-disc text-lg leading-relaxed max-w-3xl">
        {items.map((b, idx) => (
          <li key={idx} className="opacity-95">{b}</li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-6xl mx-auto relative">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="rounded p-2 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Previous slide">
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={next}
              className="rounded p-2 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Next slide">
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setPresenterMode((p) => !p)}
              className="rounded p-2 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Presenter notes">
              <Settings size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm opacity-80">{index + 1} / {slides.length}</div>
            <div className="w-56 h-2 bg-neutral-800 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${((index + 1) / slides.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rounded p-2 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Auto-play">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="rounded p-2 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Fullscreen">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>

        {/* Slide area */}
        <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-800 rounded-2xl p-10 min-h-[60vh] flex items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={slides[index].id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {slides[index].title}
                  </h1>
                  {slides[index].subtitle && (
                    <p className="mt-3 text-lg opacity-80 max-w-xl">{slides[index].subtitle}</p>
                  )}
                  <Bullets items={slides[index].bullets} />
                </div>

                <div className="flex flex-col gap-4">
                  {/* Enhanced visual placeholder with Logo */}
                  <div className="rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-6 flex-1 flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <Logo className="h-16 w-auto" />
                      </div>
                      <div className="t'ext-neutral-300 text-lg font-semibold mb-2">
                        Oliviuus Demo
                      </div>
                      <div className="text-neutral-400 text-sm max-w-[320px]">
                        {/* Screenshots, product demo, or visual content here */}
                      </div>
                    </div>
                  </div>

                  {/* Presenter notes - professional styling */}
                  <div className="text-sm">
                    <div className="p-4 rounded-xl bg-neutral-800 border border-neutral-700">
                      <div className="font-semibold text-neutral-300 mb-2">Presentation Notes</div>
                      <div className="text-neutral-400 leading-relaxed">
                        {presenterMode ? slides[index].notes : "Oliviuus Ltd. Future of Rwanda👏👏"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-x-auto py-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={`min-w-[140px] px-3 py-2 rounded-lg text-left border transition-all ${
                  i === index 
                    ? "border-emerald-400 bg-neutral-800 shadow-lg shadow-emerald-400/10" 
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                }`}>
                <div className="font-semibold text-sm truncate">{s.title}</div>
                <div className="text-xs opacity-60 truncate max-w-[120px]">{s.bullets[0]}</div>
              </button>
            ))}
          </div>

          <div className="text-sm opacity-70 hidden md:block">
            Navigation: ← → arrows • F fullscreen • P auto-play
          </div>
        </div>
      </div>
    </div>
  );
}