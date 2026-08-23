"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  distance?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * ScrollReveal: Continuous scroll bounce and vanish on viewport enter/exit
 */
export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 55,
  duration = 680,
  once = false,
  threshold = 0.1,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else {
          if (!once) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -25px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const getUnrevealedTransform = () => {
    if (direction === "up") return `translate3d(0, ${distance}px, 0) scale(0.93)`;
    if (direction === "down") return `translate3d(0, -${distance}px, 0) scale(0.93)`;
    if (direction === "left") return `translate3d(${distance}px, 0, 0) scale(0.93)`;
    if (direction === "right") return `translate3d(-${distance}px, 0, 0) scale(0.93)`;
    if (direction === "scale") return "scale(0.88)";
    return `translate3d(0, ${distance}px, 0) scale(0.93)`;
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0, 0, 0) scale(1)" : getUnrevealedTransform(),
        transition: isVisible
          ? `opacity ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1), transform ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1)`
          : "opacity 320ms ease-out, transform 320ms ease-out",
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollBounceCard: Dedicated wrapper for each product card & category card.
 * Bounces up dynamically on scroll into view and vanishes on scroll out!
 */
export function ScrollBounceCard({
  children,
  className = "",
  delay = 0,
  distance = 55,
  duration = 680,
  threshold = 0.1,
  once = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else {
          if (!once) setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -25px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translate3d(0, 0, 0) scale(1)"
          : `translate3d(0, ${distance}px, 0) scale(0.92)`,
        transition: isVisible
          ? `opacity ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1), transform ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1)`
          : "opacity 320ms ease-out, transform 320ms ease-out",
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollRevealGroup: Automatically orchestrates staggered slide-up bouncy reveals for each child in a grid or row as it scrolls into view, and vanishes when scrolled away!
 */
export function ScrollRevealGroup({
  children,
  className = "",
  staggerMs = 60,
  distance = 55,
  duration = 680,
  once = false,
}: {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  distance?: number;
  duration?: number;
  once?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else {
          if (!once) setIsVisible(false);
        }
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px -25px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const childArray = React.Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? "translate3d(0, 0, 0) scale(1)"
              : `translate3d(0, ${distance}px, 0) scale(0.92)`,
            transition: isVisible
              ? `opacity ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1), transform ${duration}ms cubic-bezier(0.34, 1.45, 0.64, 1)`
              : "opacity 320ms ease-out, transform 320ms ease-out",
            transitionDelay: isVisible ? `${index * staggerMs}ms` : "0ms",
            willChange: "transform, opacity",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
