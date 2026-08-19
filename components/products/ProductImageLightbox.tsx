"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

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
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
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
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(3, s + 0.5));
      } else if (e.key === "-") {
        setScale((s) => Math.max(1, s - 0.5));
      } else if (e.key === "0") {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Zoom controls
  function handleZoomIn() {
    setScale((s) => Math.min(3, s + 0.5));
  }

  function handleZoomOut() {
    setScale((s) => {
      const next = Math.max(1, s - 0.5);
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
      setScale(2);
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

    // If horizontal swipe > 50px and vertical movement is low
    if (Math.abs(diffX) > 50 && diffY < 60) {
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

  const modalContent = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999999] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="High Definition Product Image Preview"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Top Header Action Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        {/* Title & Counter */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider bg-[#C59B27] text-white shadow-md">
            {currentIndex + 1} / {images.length}
          </span>
          <div className="hidden sm:block">
            <h3 className="font-display text-sm font-bold text-white truncate max-w-md">
              {productName}
            </h3>
            <p className="text-[10px] text-white/60">
              High Definition Detail Preview · Click or pinch to zoom
            </p>
          </div>
        </div>

        {/* Zoom & Close Toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-base transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom In (+)"
          >
            ＋
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-base transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom Out (-)"
          >
            －
          </button>

          {/* Reset Zoom */}
          {scale > 1 && (
            <button
              onClick={handleResetZoom}
              className="px-3 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title="Reset Zoom (0)"
            >
              Reset {Math.round(scale * 100)}%
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center font-bold text-lg transition-colors ml-2 cursor-pointer shadow-md"
            aria-label="Close HD Preview (Esc)"
            title="Close Preview (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Central High-Definition Image Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleTap}
      >
        {/* Left Arrow Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-xl sm:text-2xl transition-all shadow-xl hover:scale-110 cursor-pointer active:scale-95"
            aria-label="Previous Image"
            title="Previous (Left Arrow)"
          >
            ‹
          </button>
        )}

        {/* The Scalable High-Res Image */}
        <div
          className="relative max-w-full max-h-full transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
        >
          <div className="relative w-[85vw] max-w-[700px] h-[65vh] sm:h-[72vh]">
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.altText || productName}
              fill
              sizes="(max-width: 1024px) 90vw, 800px"
              priority
              quality={95}
              className="object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>
        </div>

        {/* Right Arrow Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-xl sm:text-2xl transition-all shadow-xl hover:scale-110 cursor-pointer active:scale-95"
            aria-label="Next Image"
            title="Next (Right Arrow)"
          >
            ›
          </button>
        )}
      </div>

      {/* 3. Bottom Thumbnail Carousel Strip */}
      <div className="relative z-30 px-4 sm:px-6 py-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col items-center gap-2">
        <p className="text-[11px] text-white/70 text-center font-medium">
          Double-click to {scale > 1 ? "reset zoom" : "zoom in 2x"} · Use keyboard ← → arrows to navigate
        </p>

        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 no-scrollbar">
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
                  className={`relative h-14 w-12 sm:h-16 sm:w-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-[#C59B27] scale-110 shadow-lg shadow-[#C59B27]/30 opacity-100"
                      : "border-white/30 opacity-50 hover:opacity-100 hover:scale-105"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={img.imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
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
