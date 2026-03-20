import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transformImage } from "../api/images";
import type { Image, TransformType } from "../types";
import { cn } from "../lib/utils";

interface TransformPanelProps {
  image: Image;
  onClose: () => void;
}

const TRANSFORMS: { id: TransformType; label: string; description: string }[] = [
  { id: "grayscale", label: "Grayscale", description: "Convert to black & white" },
  { id: "sepia", label: "Sepia", description: "Warm vintage tone" },
  { id: "blur", label: "Blur", description: "Soft 5×5 box blur" },
  { id: "sharpen", label: "Sharpen", description: "Enhance edge detail" },
  { id: "invert", label: "Invert", description: "Reverse all colors" },
];

export default function TransformPanel({ image, onClose }: TransformPanelProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<TransformType>>(() => {
    // Pre-select previously applied transforms
    const initial = new Set<TransformType>();
    if (image.transformations) {
      for (const t of image.transformations) {
        if (TRANSFORMS.some((tr) => tr.id === t)) {
          initial.add(t as TransformType);
        }
      }
    }
    return initial;
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => transformImage(image.id, Array.from(selected)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      onClose();
    },
  });

  function toggle(id: TransformType) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(TRANSFORMS.map((t) => t.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const src = image.compressedUrl || image.originalUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-medium text-gray-800">Transform Image</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select one or more effects to apply together</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-50 min-h-[300px]">
            {src ? (
              <img src={src} alt={image.filename} className="max-w-full max-h-[45vh] object-contain rounded-lg" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3 truncate max-w-full">{image.filename}</p>
          </div>

          {/* Transform options */}
          <div className="w-64 border-l border-gray-100 flex flex-col">
            {/* Effects header with select/clear */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Effects</p>
              {!isPending && (
                <button
                  onClick={selected.size === TRANSFORMS.length ? clearAll : selectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {selected.size === TRANSFORMS.length ? "Clear all" : "Select all"}
                </button>
              )}
            </div>

            {/* Effect list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
              {TRANSFORMS.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                      isSelected
                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                        : "hover:bg-gray-50",
                      isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border-2",
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300 bg-white"
                    )}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", isSelected ? "text-indigo-700" : "text-gray-700")}>{t.label}</p>
                      <p className="text-xs text-gray-400">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Applied transforms info */}
            {image.transformations && image.transformations.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5">Currently applied</p>
                <div className="flex flex-wrap gap-1">
                  {image.transformations.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{t}</span>
                  ))}
                </div>
                {image.transformedUrl && (
                  <a href={image.transformedUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline mt-1.5 inline-block">
                    View transformed version
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          <div>
            {isError ? (
              <p className="text-xs text-red-600 font-medium">Failed to apply transforms. Try again.</p>
            ) : (
              <p className="text-xs text-gray-400">
                {selected.size > 0
                  ? `${selected.size} of ${TRANSFORMS.length} effect${selected.size > 1 ? "s" : ""} selected — applied in order`
                  : "Select effects to apply"
                }
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => mutate()}
              disabled={selected.size === 0 || isPending}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {isPending ? "Applying…" : `Apply ${selected.size > 0 ? selected.size + " effect" + (selected.size > 1 ? "s" : "") : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
