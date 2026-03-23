import { useRef, useState, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Edited",
  className = "",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [loaded, setLoaded] = useState({ before: false, after: false });

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support: left/right arrows when focused
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.stopPropagation();
      setPosition((p) => Math.max(0, p - 2));
    } else if (e.key === "ArrowRight") {
      e.stopPropagation();
      setPosition((p) => Math.min(100, p + 2));
    }
  }, []);

  // Reset position when images change
  useEffect(() => {
    setPosition(50);
    setLoaded({ before: false, after: false });
  }, [beforeSrc, afterSrc]);

  const bothLoaded = loaded.before && loaded.after;

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-lg ${className}`}
      style={{ cursor: isDragging ? "ew-resize" : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Loading spinner */}
      {!bothLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-20">
          <svg className="animate-spin h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {/* After image (full, behind) */}
      <img
        src={afterSrc}
        alt="After"
        className="block w-full h-auto max-h-[75vh] object-contain"
        draggable={false}
        onLoad={() => setLoaded((l) => ({ ...l, after: true }))}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeSrc}
          alt="Before"
          className="block w-full h-auto max-h-[75vh] object-contain"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }}
          draggable={false}
          onLoad={() => setLoaded((l) => ({ ...l, before: true }))}
        />
      </div>

      {/* Slider line */}
      {bothLoaded && (
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          {/* Vertical line */}
          <div className="w-0.5 h-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]" />

          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
            </svg>
          </div>
        </div>
      )}

      {/* Labels */}
      {bothLoaded && (
        <>
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-xs font-semibold bg-black/50 text-white rounded-full backdrop-blur-sm">
              {beforeLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 text-xs font-semibold bg-black/50 text-white rounded-full backdrop-blur-sm">
              {afterLabel}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
