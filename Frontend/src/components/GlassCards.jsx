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
        <p className="glass-section-overline">Why LokAyukt?</p>
        <h2 className="glass-section-title">
          Smart Governance & Global Accountability
        </h2>
        <p className="glass-section-subtitle">
          A next-generation platform for real-time grievance tracking, verified ground-truth, 
          and transparent municipal administration.
        </p>
      </div>

      {/* Three Glass Cards */}
      <div className="glass-cards-grid">
        {/* ── Card 1: About the Platform ── */}
        <div className="glass-card glass-card--about">
          <div className="glass-card-icon">🏛️</div>
          <h3 className="glass-card-title">Accountable Governance</h3>
          <p className="glass-card-desc">
            LokAyukt bridges the trust gap between citizens and authorities. 
            By providing a transparent, map-based interface for reporting and 
            monitoring civic issues, we ensure that every complaint is tracked, 
            verified, and resolved with full public accountability.
          </p>
        </div>

        {/* ── Card 2: Key Features ── */}
        <div className="glass-card glass-card--features">
          <div className="glass-card-icon">🤖</div>
          <h3 className="glass-card-title">AI-Powered Verification</h3>
          <p className="glass-card-desc">
            Ensuring ground-truth through advanced multi-modal AI and citizen consensus:
          </p>
          <ul className="glass-feature-list">
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">📸</span>
              AI-driven 'Before & After' photo verification
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">⚖️</span>
              Citizen-led consensus polls for resolution audits
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">🧠</span>
              Automated issue classification & department routing
            </li>
            <li className="glass-feature-item">
              <span className="glass-feature-bullet">📍</span>
              Geo-fenced reporting to prevent false signatures
            </li>
          </ul>
        </div>

        {/* ── Card 3: Data Insights ── */}
        <div className="glass-card glass-card--insights">
          <div className="glass-card-icon">📊</div>
          <h3 className="glass-card-title">Actionable Insights</h3>
          <p className="glass-card-desc">
            Data-driven intelligence for municipal administrators. Our platform 
            analyzes spatial clusters and resolution metrics to optimize resource 
            allocation and identify systemic civic bottlenecks across wards.
          </p>
          <div className="glass-data-tags">
            <span className="glass-data-tag">📍 Heatmaps</span>
            <span className="glass-data-tag">📉 Efficiency</span>
            <span className="glass-data-tag">🏘️ Ward Lead</span>
            <span className="glass-data-tag">🤝 Trust Score</span>
            <span className="glass-data-tag">🔍 Audits</span>
            <span className="glass-data-tag">🚀 Resolution</span>
          </div>
        </div>
      </div>
    </section>
  );
}
