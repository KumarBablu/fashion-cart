"use client";

import React, { useEffect, useState } from "react";

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  char: string;
  color: string;
}

interface RippleEffect {
  id: number;
  x: number;
  y: number;
}

const SPARKLE_CHARS = ["✦", "✧", "·", "★", "⋄"];
const GOLD_COLORS = [
  "#D4AF37", // Metallic Gold
  "#F3E5AB", // Champagne Light
  "#C59B27", // Imperial Gold
  "#FFF8DC", // Pure Silk Gold
  "#B8860B", // Dark Goldenrod
];

export default function LuxuryClickEffects() {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);

  useEffect(() => {
    let idCounter = 0;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      // Get exact coordinates for either mouse or touch
      let clientX = 0;
      let clientY = 0;

      if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      if (!clientX && !clientY) return;

      const rippleId = ++idCounter;

      // 1. Add Gold Aura Halo Ripple
      setRipples((prev) => [...prev.slice(-8), { id: rippleId, x: clientX, y: clientY }]);

      // 2. Generate 5-7 Sparkling Atelier Light Particles
      const particleCount = 5 + Math.floor(Math.random() * 3);
      const newParticles: SparkleParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 25 + Math.random() * 35;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const char = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
        const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];
        const size = 10 + Math.random() * 8;

        newParticles.push({
          id: ++idCounter,
          x: clientX,
          y: clientY,
          vx,
          vy,
          size,
          char,
          color,
        });
      }

      setParticles((prev) => [...prev.slice(-16), ...newParticles]);

      // Remove after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 650);

      const particleIds = newParticles.map((p) => p.id);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !particleIds.includes(p.id)));
      }, 550);

      // 3. Tactile Element Pulse (if clicked inside a card or button)
      const target = (e.target as HTMLElement)?.closest(
        "button, a, .luxury-card-hover, [role='button'], input[type='submit']"
      );
      if (target) {
        target.classList.add("luxury-click-active");
        setTimeout(() => target.classList.remove("luxury-click-active"), 350);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Luminous Champagne Gold Aura Halo Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="luxury-click-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}

      {/* 2. Dispersing Diamond & Gold Sparkles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="luxury-click-sparkle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            fontSize: `${p.size}px`,
            color: p.color,
            textShadow: `0 0 10px ${p.color}, 0 0 20px rgba(212, 175, 55, 0.8)`,
            transform: `translate(${p.vx}px, ${p.vy}px) scale(0)`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
