import { useEffect, useState } from "react";
import type { Image, ProcessingStep } from "../types";
import BeforeAfterSlider from "./BeforeAfterSlider";

type ViewMode = "edited" | "original" | "compare";

interface ImagePreviewProps {
  image: Image;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ImagePreview({ image, onClose, onPrev, onNext }: ImagePreviewProps) {
  const hasTransform = !!image.transformedUrl;
  const [viewMode, setViewMode] = useState<ViewMode>("edited");

  // Reset view mode when image changes
  useEffect(() => {
    setViewMode("edited");
  }, [image.id]);

  const originalSrc = image.compressedUrl || "";
  const editedSrc = hasTransform ? image.transformedUrl! : originalSrc;
  const displaySrc = viewMode === "original" ? originalSrc : editedSrc;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {viewMode === "compare" && hasTransform ? (
          <BeforeAfterSlider
            beforeSrc={originalSrc}
            afterSrc={editedSrc}
            className="max-w-full shadow-2xl"
          />
        ) : displaySrc ? (
          <img
            src={displaySrc}
            alt={image.filename}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-800 rounded-lg">
            <svg className="w-16 h-16 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        )}

        {/* Filename + transforms */}
        <p className="mt-3 text-sm text-white/70 truncate max-w-md">{image.filename}</p>
        {image.transformations && image.transformations.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {image.transformations.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">{t.type}</span>
            ))}
          </div>
        )}

        {/* View mode switcher */}
        {hasTransform && (
          <div className="flex gap-1 mt-2 bg-white/10 rounded-full p-1">
            {([
              { mode: "edited" as const, label: "Edited" },
              { mode: "original" as const, label: "Original" },
              { mode: "compare" as const, label: "Compare", icon: true },
            ]).map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === mode
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {icon && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
                  </svg>
                )}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Compact processing timeline */}
        {image.processingHistory && image.processingHistory.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {image.processingHistory.map((step: ProcessingStep, i: number) => {
              const colors: Record<string, string> = {
                uploaded: "bg-blue-400", compressed: "bg-green-400",
                transformed: "bg-purple-400", reverted: "bg-amber-400",
              };
              const labels: Record<string, string> = {
                uploaded: "Raw", compressed: "Compressed",
                transformed: "Transformed", reverted: "Reverted",
              };
              const isLast = i === image.processingHistory!.length - 1;
              const sizeStr = step.sizeBytes > 0
                ? step.sizeBytes >= 1048576 ? `${(step.sizeBytes / 1048576).toFixed(1)} MB` : `${(step.sizeBytes / 1024).toFixed(0)} KB`
                : "";
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <div className={`px-2 py-1 rounded-md ${colors[step.step] || "bg-gray-400"} text-white text-[10px] font-medium whitespace-nowrap`}>
                      {labels[step.step] || step.step}
                      {sizeStr && <span className="ml-1 opacity-80">{sizeStr}</span>}
                      {step.durationMs > 0 && <span className="ml-1 opacity-70">{step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`}</span>}
                    </div>
                  </div>
                  {!isLast && (
                    <svg className="w-3 h-3 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
