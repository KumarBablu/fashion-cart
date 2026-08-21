"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

type LightboxImage = {
  id?: string;
  imageUrl: string;
  altText?: string | null;
};

type ProductImageLightboxProps = {
  isOpen: boolean;
  images: LightboxImage[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
};

export default function ProductImageLightbox({
  isOpen,
  images,
  initialIndex = 0,
  productName,
  onClose,
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setDirection(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setDirection("right");
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setDirection("left");
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(4, s + 0.5));
      } else if (e.key === "-") {
        setScale((s) => Math.max(1, s - 0.5));
      } else if (e.key === "0") {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Fullscreen Toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // Zoom controls
  function handleZoomIn() {
    setScale((s) => Math.min(4, Number((s + 0.5).toFixed(1))));
  }

  function handleZoomOut() {
    setScale((s) => {
      const next = Math.max(1, Number((s - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }

  function handleResetZoom() {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleDoubleTap(e: React.MouseEvent) {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.2);
    }
  }

  // Mouse wheel zoom
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(4, Number((s + 0.25).toFixed(2))));
    } else {
      setScale((s) => {
        const next = Math.max(1, Number((s - 0.25).toFixed(2)));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  }

  // Mouse pan / drag when zoomed
  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Mobile swipe gestures
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1 && scale === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current || scale > 1) return;
    const touchEnd = e.changedTouches[0];
    const diffX = touchStartRef.current.x - touchEnd.clientX;
    const diffY = Math.abs(touchStartRef.current.y - touchEnd.clientY);

    if (Math.abs(diffX) > 45 && diffY < 60) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartRef.current = null;
  }

  if (!isOpen || !mounted || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const normalizedSrc = normalizeImageUrl(currentImage?.imageUrl);

  const modalContent = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999999] flex flex-col justify-between bg-black/95 backdrop-blur-2xl select-none animate-in fade-in duration-300 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="High Definition Product Image Preview"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Ambient background glow matching couture lighting */}
      <div className="absolute inset-0 bg-radial from-[#C59B27]/10 via-transparent to-black pointer-events-none" />

      {/* 1. Top Luxury Floating Header Action Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        {/* Title & Luxury Counter Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <span className="text-[#C59B27] text-xs">✦</span>
            <span className="text-xs font-black font-mono tracking-widest text-white">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="hidden md:block">
            <h3 className="font-display text-sm font-bold text-white tracking-wide truncate max-w-md drop-shadow-md">
              {productName}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-[#E8D8A0] font-medium">
              High Definition Detail Atelier
            </p>
          </div>
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Level Indicator / Reset */}
          {scale > 1 && (
            <button
              onClick={handleResetZoom}
              className="px-3 h-9 rounded-full bg-[#C59B27]/20 border border-[#C59B27] text-[#E8D8A0] hover:bg-[#C59B27] hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer animate-in zoom-in-90"
              title="Reset Zoom to 100% (0)"
            >
              Reset {Math.round(scale * 100)}%
            </button>
          )}

          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center font-bold text-base transition-all disabled:opacity-30 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            ＋
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center font-bold text-base transition-all disabled:opacity-30 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            －
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white hidden sm:flex items-center justify-center text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            aria-label="Fullscreen toggle"
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-rose-600 border border-white/30 text-white flex items-center justify-center font-bold text-sm transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl ml-1 sm:ml-2"
            aria-label="Close HD Preview (Esc)"
            title="Close Preview (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Central Viewport with Smooth Image Transitions */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleTap}
      >
        {/* Left Floating Arrow Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-8 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-[#C59B27] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-2xl transition-all shadow-2xl hover:scale-110 cursor-pointer active:scale-95 backdrop-blur-md group"
            aria-label="Previous Image (Left Arrow)"
            title="Previous (Left Arrow)"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">‹</span>
          </button>
        )}

        {/* High-Resolution Main Garment Image with Kinetic Animation */}
        <div
          key={currentIndex}
          className="relative max-w-full max-h-full transition-transform duration-200 ease-out animate-in fade-in zoom-in-95 duration-300"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
        >
          <div className="relative w-[88vw] max-w-[720px] h-[65vh] sm:h-[72vh]">
            <Image
              src={normalizedSrc}
              alt={currentImage.altText || productName}
              fill
              sizes="(max-width: 1024px) 95vw, 850px"
              priority
              quality={95}
              unoptimized={true}
              className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-300"
            />
          </div>
        </div>

        {/* Right Floating Arrow Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-8 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-[#C59B27] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-2xl transition-all shadow-2xl hover:scale-110 cursor-pointer active:scale-95 backdrop-blur-md group"
            aria-label="Next Image (Right Arrow)"
            title="Next (Right Arrow / Space)"
          >
            <span className="transition-transform group-hover:translate-x-0.5">›</span>
          </button>
        )}
      </div>

      {/* 3. Bottom Glassmorphic Carousel Dock */}
      <div className="relative z-30 px-4 sm:px-8 py-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-2.5">
        <p className="text-[11px] text-white/70 text-center font-medium tracking-wide">
          Double-click or scroll wheel to zoom · Drag to pan · Use keyboard ← → arrows
        </p>

        {images.length > 1 && (
          <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
            {images.map((img, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={img.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                    setCurrentIndex(idx);
                  }}
                  className={`relative h-14 w-12 sm:h-16 sm:w-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "border-[#C59B27] ring-4 ring-[#C59B27]/40 scale-110 shadow-xl opacity-100"
                      : "border-white/20 opacity-40 hover:opacity-90 hover:scale-105"
                  }`}
                  aria-label={`View look ${idx + 1}`}
                >
                  <Image
                    src={normalizeImageUrl(img.imageUrl)}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized={true}
                    className="object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-[#C59B27]/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
