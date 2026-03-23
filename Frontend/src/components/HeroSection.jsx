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
  { text: "Discover",   className: "hero-word",                delay: 0.35 },
  { text: " ",          className: "hero-word",                delay: 0.42, space: true },
  { text: "Incredible", className: "hero-word hero-word--accent", delay: 0.50 },
];

const TITLE_WORDS_LINE2 = [
  { text: "Bhārat",     className: "hero-word hero-word--bold",   delay: 0.65 },
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
        <div className="hero-glass-card-icon">🗺️</div>
        <div className="hero-glass-card-title">Interactive Cultural Map</div>
        <div className="hero-glass-card-desc">
          Explore traditions, languages, and heritage across every state and territory.
        </div>
        <ul className="hero-glass-card-list">
          <li>🖱️ Click any state to explore</li>
          <li>🎭 Culture, history &amp; cuisine</li>
          <li>🎥 Cinematic map experience</li>
        </ul>
        <div className="hero-glass-card-stat">
          <span className="hero-glass-card-stat-num">36</span>
          <span className="hero-glass-card-stat-label">Regions to Explore</span>
        </div>
      </div>

      {/* ── Floating Glass Card — Right ── */}
      <div
        className={`hero-glass-card hero-glass-card--right${cardsFloating ? " floating" : ""}`}
        style={cardsFloating ? undefined : { transform: `translateY(${-pxCardR}px)` }}
      >
        <div className="hero-glass-card-icon">📊</div>
        <div className="hero-glass-card-title">Cultural Insights</div>
        <div className="hero-glass-card-desc">
          Visualise India's incredible diversity through interactive data and storytelling.
        </div>
        <ul className="hero-glass-card-list">
          <li>📈 Population &amp; demographics</li>
          <li>💰 Economy &amp; trade data</li>
          <li>🏔️ Geography &amp; terrain</li>
        </ul>
        <div className="hero-glass-card-stat">
          <span className="hero-glass-card-stat-num">1.4B</span>
          <span className="hero-glass-card-stat-label">People, One Story</span>
        </div>
      </div>

      {/* ── Floating Micro-Badges — decorative pills ── */}
      <div className="hero-micro-badge hero-micro-badge--1" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 1.5}px)` }}>
        🏛️ <span>40 UNESCO Sites</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--2" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 2}px)` }}>
        🗣️ <span>22 Official Languages</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--3" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb}px)` }}>
        💃 <span>8 Classical Dances</span>
      </div>
      <div className="hero-micro-badge hero-micro-badge--4" style={cardsFloating ? undefined : { transform: `translateY(${-pxOrb * 1.2}px)` }}>
        🍛 <span>31 State Cuisines</span>
      </div>

      {/* ── Hero Content ── */}
      <div
        className="hero-content"
        style={{ transform: `translateY(${-pxContent}px)` }}
      >
        {/* Glass badge */}
        <div className="hero-glass-badge">
          <span className="hero-badge-dot" />
          Government of India · Ministry of Culture
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
          Three thousand years of unbroken civilisation, twenty-two classical
          languages, and a billion stories — all waiting to be explored, one state at a time.
        </p>

        {/* Divider */}
        <div className="hero-divider">
          <div className="hero-line" />
          <div className="hero-diamond" />
          <div className="hero-line" />
        </div>

        {/* Premium CTA */}
        <a href="#map" className="hero-cta">
          Explore the Map
          <span className="hero-cta-arrow">→</span>
        </a>

        {/* Animated statistics */}
        <div className="hero-stats">
          <StatBlock num="28" label="States" delay={0} trigger={heroVis} />
          <StatBlock num="8" label="Union Territories" delay={100} trigger={heroVis} />
          <StatBlock num="22" label="Languages" delay={200} trigger={heroVis} />
          <StatBlock num="1.4" label="Billion Citizens" delay={300} trigger={heroVis} />
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
