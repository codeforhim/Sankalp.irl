import { useState, useEffect, useRef } from "react";
import "./HeroSection.css";

/* ── Animated counter hook ── */
function useCountUp(target, duration = 1800, trigger = true) {
  const [val, setVal] = useState(0);
  const isNumber = !isNaN(parseFloat(target));
  useEffect(() => {
    if (!trigger || !isNumber) return;
    const num = parseFloat(target);
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(+(eased * num).toFixed(target.toString().includes('.') ? 1 : 0));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger, isNumber]);
  return isNumber ? val : target;
}

/* ── Stat block with animated counter ── */
function StatBlock({ num, label, delay = 0, trigger }) {
  const v = useCountUp(num, 1800, trigger);
  return (
    <div className="stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-num">{v}{num === "1.4" ? "B" : ""}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ── Title words configuration ── */
const TITLE_WORDS = [
  { text: "स्थानीय शासन होगा",   className: "hero-word",                delay: 0.35 },
  { text: " ",          className: "hero-word",                delay: 0.42, space: true },
  { text: "संयुक्त,", className: "hero-word hero-word--accent", delay: 0.50 },
]

const TITLE_WORDS_LINE2 = [
  { text: "जब भारत चुनेगा",   className: "hero-word",                delay: 0.65 },
  { text: " ",          className: "hero-word",                delay: 0.72, space: true },
  { text: "लोकायुक्त।", className: "hero-word hero-word--accent", delay: 0.80 },
];

/* ═══════════════════════════════════════════
   HeroSection — Premium glassmorphism hero
   ═══════════════════════════════════════════ */
export default function HeroSection({ heroRef, heroVis, scrollY }) {
  /* After entry animations complete, switch glass cards to floating loop */
  const [cardsFloating, setCardsFloating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCardsFloating(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  /* Parallax factors */
  const pxContent = scrollY * 0.15;
  const pxCardL   = scrollY * 0.08;
  const pxCardR   = scrollY * 0.12;
  const pxOrb     = scrollY * 0.05;
  const scrolledPast = scrollY > 100;

  return (
    <section className="hero" ref={heroRef}>
      {/* ── Background orbs (parallax) ── */}
      <div
        className="hero-bg-orb hero-bg-orb--warm"
        style={{ transform: `translate(0, ${pxOrb}px)` }}
      />
      <div
        className="hero-bg-orb hero-bg-orb--green"
        style={{ transform: `translate(0, ${-pxOrb}px)` }}
      />
      <div
        className="hero-bg-orb hero-bg-orb--gold"
        style={{ transform: `translateX(-50%) translateY(${pxOrb * 0.5}px)` }}
      />

      {/* ── Floating Glass Card — Left ── */}
      <div
        className={`hero-glass-card hero-glass-card--left${cardsFloating ? " floating" : ""}`}
        style={cardsFloating ? undefined : { transform: `translateY(${-pxCardL}px)` }}
      >
        <div className="hero-glass-card-icon">🏛️</div>
        <div className="hero-glass-card-title">Accountable Governance</div>
        <div className="hero-glass-card-desc">
          Direct connection between citizens and municipal authorities for rapid resolution.
        </div>
        <ul className="hero-glass-card-list">
          <li>📢 Real-time grievance tracking</li>
          <li>🛡️ Verified ground-truth checks</li>
          <li>✅ Transparent officer accountability</li>
        </ul>
        <div className="hero-glass-card-stat">
          <span className="hero-glass-card-stat-num">98%</span>
          <span className="hero-glass-card-stat-label">Resolution Rate</span>
        </div>
      </div>

      {/* ── Floating Glass Card — Right ── */}
      <div
        className={`hero-glass-card hero-glass-card--right${cardsFloating ? " floating" : ""}`}
        style={cardsFloating ? undefined : { transform: `translateY(${-pxCardR}px)` }}
      >
        <div className="hero-glass-card-icon">📊</div>
        <div className="hero-glass-card-title">City Heatmap Analytics</div>
        <div className="hero-glass-card-desc">
          AI-powered spatial insights to identify and eliminate civic bottlenecks.
        </div>
        <ul className="hero-glass-card-list">
          <li>📍 Spatial issue clustering</li>
          <li>📈 Predictive ward analytics</li>
          <li>🎯 Targeted resource allocation</li>
        </ul>
        <div className="hero-glass-card-stat">
          <span className="hero-glass-card-stat-num">24/7</span>
          <span className="hero-glass-card-stat-label">Active Monitoring</span>
        </div>
      </div>

      {/* ── Floating Micro-Badges — decorative pills ── */}
      <div className="hero-micro-badge hero-micro-badge--1" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 1.5}px)` }}>
        🤖 <span>AI Verification</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--2" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 2}px)` }}>
        🏙️ <span>Ward Lead</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--3" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb}px)` }}>
        🔒 <span>Encrypted Tracking</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--4" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 1.2}px)` }}>
        🌍 <span>Citizen-Led</span>
      </div>

      {/* ── Hero Content ── */}
      <div
        className="hero-content"
        style={{ transform: `translateY(${-pxContent}px)` }}
      >
        {/* Glass badge */}
        <div className="hero-glass-badge">
          <img src="/logo.jpeg" alt="Logo" className="w-4 h-4 object-contain" />
          LokAyukt · Smart Governance Platform
        </div>

        {/* Staggered title */}
        <h1 className="hero-title">
          <span className="hero-title-line">
            {TITLE_WORDS.map((w, i) =>
              w.space ? (
                <span key={i}>&nbsp;</span>
              ) : (
                <span
                  key={i}
                  className={w.className}
                  style={{ animationDelay: `${w.delay}s` }}
                >
                  {w.text}
                </span>
              )
            )}
          </span>
          <span className="hero-title-line">
            {TITLE_WORDS_LINE2.map((w, i) => (
              <span
                key={i}
                className={w.className}
                style={{ animationDelay: `${w.delay}s` }}
              >
                {w.text}
              </span>
            ))}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-sub">
          A next-generation AI governance platform bridging the gap between citizens and authorities. 
          Report, verify, and resolve — ensuring Every Voice counts.
        </p>

        {/* Divider */}
        <div className="hero-divider">
          <div className="hero-line" />
          <div className="hero-diamond" />
          <div className="hero-line" />
        </div>

        {/* Premium CTA */}
        <a href="/public-feed" className="hero-cta">
          View Public Feed
          <span className="hero-cta-arrow">→</span>
        </a>

        {/* Animated statistics */}
        <div className="hero-stats">
          <StatBlock num="150" label="Active Wards" delay={0} trigger={heroVis} />
          <StatBlock num="12" label="Govt Departments" delay={100} trigger={heroVis} />
          <StatBlock num="4.8" label="Trust Score" delay={200} trigger={heroVis} />
          <StatBlock num="10" label="K+ Resolutions" delay={300} trigger={heroVis} />
        </div>
      </div>

      {/* Scroll hint */}
      <div className={`hero-scroll-hint${scrolledPast ? " faded" : ""}`}>
        <span>Scroll</span>
        <div className="hero-scroll-chevron" />
      </div>
    </section>
  );
}
