import { useState, useEffect, useRef } from "react";
import "./GlassCards.css";

/* ── Scroll reveal hook (mirrors App.jsx pattern) ── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── GlassCards Section ── */
export default function GlassCards() {
  const [sectionRef, sectionVisible] = useReveal(0.08);

  return (
    <section
      className={`glass-section${sectionVisible ? " visible" : ""}`}
      ref={sectionRef}
    >
      {/* Decorative background blurs */}
      <div className="glass-section-bg glass-section-bg--1" />
      <div className="glass-section-bg glass-section-bg--2" />
      <div className="glass-section-bg glass-section-bg--3" />

      {/* Section Header */}
      <div className="glass-section-header">
        <p className="glass-section-overline">Why This Platform</p>
        <h2 className="glass-section-title">
          Explore India Like Never Before
        </h2>
        <p className="glass-section-subtitle">
          An interactive experience bringing together culture, data, and
          storytelling across every state and territory.
        </p>
      </div>

      {/* Three Glass Cards */}
      <div className="glass-cards-grid">
        {/* ── Card 1: About the Platform ── */}
        <div className="glass-card glass-card--about">
          <div className="glass-card-icon">🗺️</div>
          <h3 className="glass-card-title">About the Platform</h3>
          <p className="glass-card-desc">
            The India Heritage Portal gives you a cinematic, interactive map
            of the entire nation. Explore every state and union territory —
            from the snow-capped Himalayas to the tropical coast of Kerala —
            and uncover rich stories of culture, history, cuisine, and
            heritage — all in one beautifully crafted experience.
          </p>
        </div>

        {/* ── Card 2: Key Features ── */}
        <div className="glass-card glass-card--features">
          <div className="glass-card-icon">⚡</div>
          <h3 className="glass-card-title">Key Features</h3>
          <p className="glass-card-desc">
            Designed for curiosity-driven exploration with a premium feel:
          </p>
          <ul className="glass-feature-list">
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">🖱️</span>
              Clickable states with instant detail panels
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">💬</span>
              Dynamic data popups on hover and selection
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">🎥</span>
              Cinematic map visualization with smooth animations
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">🔍</span>
              Interactive exploration of 28 states &amp; 8 UTs
            </li>
          </ul>
        </div>

        {/* ── Card 3: Data Insights ── */}
        <div className="glass-card glass-card--insights">
          <div className="glass-card-icon">📊</div>
          <h3 className="glass-card-title">Data Insights</h3>
          <p className="glass-card-desc">
            Go beyond the surface. The platform surfaces curated insights
            into each state — spanning demographics, economy, geography,
            languages, and cultural heritage — giving you a comprehensive
            view of India&apos;s incredible diversity.
          </p>
          <div className="glass-data-tags">
            <span className="glass-data-tag">📈 Population</span>
            <span className="glass-data-tag">💰 Economy</span>
            <span className="glass-data-tag">🏔️ Geography</span>
            <span className="glass-data-tag">🗣️ Languages</span>
            <span className="glass-data-tag">🎭 Culture</span>
            <span className="glass-data-tag">🍲 Cuisine</span>
          </div>
        </div>
      </div>
    </section>
  );
}
