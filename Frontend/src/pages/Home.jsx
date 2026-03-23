import React, { useState, useEffect, useRef } from 'react';
import HeroSection from '../components/HeroSection';
import IndiaMap from '../components/IndiaMap';
import GlassCards from '../components/GlassCards';

/* ── Scroll reveal hook ── */
function useReveal(threshold = 0.12) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { 
            if (e.isIntersecting) { 
                setVisible(true); 
                obs.disconnect(); 
            } 
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

const Home = () => {
    const [heroRef, heroVis] = useReveal(0.15);
    const [mapSecRef, mapSecVis] = useReveal(0.08);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="flex-1 bg-[#FAFAF8] relative overflow-hidden">
            {/* ── HERO SECTION ── */}
            <HeroSection heroRef={heroRef} heroVis={heroVis} scrollY={scrollY} />

            {/* ── MAP SECTION ── */}
            <div
                className={`map-section ${mapSecVis ? "visible" : ""}`}
                id="map"
                ref={mapSecRef}
            >
                <div className="section-header">
                    <p className="section-overline">Interactive Accountability Hub</p>
                    <h2 className="section-title">LokAyukt Accountability Network</h2>
                    <p className="section-desc">Real-time civic data and grievance metrics across the nation. Click on any state to view regional performance and ward-level updates.</p>
                </div>
                
                <IndiaMap />
            </div>

            {/* ── GLASS FEATURE CARDS ── */}
            <GlassCards />

            {/* Subtle bottom gradient */}
            <div className="h-24 bg-gradient-to-t from-[#B0ABA5]/10 to-transparent"></div>
        </div>
    );
};

export default Home;
