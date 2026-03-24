import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transformImage, revertTransform, batchTransformImages, batchRevertTransform, getBatchStatus, isAsyncResult } from "../api/images";
import type { Image, TransformType, TransformConfig, WatermarkPosition, ProcessingStep } from "../types";
import { cn } from "../lib/utils";

interface TransformPanelProps {
  image?: Image;
  imageIds?: string[];
  onClose: () => void;
}

interface TransformDef {
  id: TransformType;
  label: string;
  description: string;
  hasParams?: boolean;
}

const EFFECTS: TransformDef[] = [
  { id: "grayscale", label: "Grayscale", description: "Convert to black & white" },
  { id: "sepia", label: "Sepia", description: "Warm vintage tone" },
  { id: "blur", label: "Blur", description: "Soft box blur" },
  { id: "sharpen", label: "Sharpen", description: "Enhance edge detail" },
  { id: "invert", label: "Invert", description: "Reverse all colors" },
  { id: "remove-bg", label: "Remove Background", description: "Remove white/light backgrounds" },
];

const ADJUSTMENTS: TransformDef[] = [
  { id: "resize", label: "Resize", description: "Scale to new dimensions", hasParams: true },
  { id: "crop", label: "Crop", description: "Extract a region", hasParams: true },
  { id: "watermark", label: "Watermark", description: "Add text overlay", hasParams: true },
  { id: "format", label: "Convert Format", description: "Change image format", hasParams: true },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const STEP_META: Record<string, { label: string; color: string; icon: string }> = {
  uploaded:    { label: "Uploaded",    color: "bg-blue-500",   icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  compressed:  { label: "Compressed",  color: "bg-green-500",  icon: "M19 14l-7 7m0 0l-7-7m7 7V3" },
  transformed: { label: "Transformed", color: "bg-purple-500", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  reverted:    { label: "Reverted",    color: "bg-amber-500",  icon: "M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" },
};

export default function TransformPanel({ image, imageIds, onClose }: TransformPanelProps) {
  const queryClient = useQueryClient();
  const isBatchMode = !image && imageIds && imageIds.length > 0;

  // Simple toggles
  const [selected, setSelected] = useState<Set<TransformType>>(() => {
    const initial = new Set<TransformType>();
    if (image?.transformations) {
      for (const t of image.transformations) {
        if ([...EFFECTS, ...ADJUSTMENTS].some((tr) => tr.id === t.type)) {
          initial.add(t.type as TransformType);
        }
      }
    }
    return initial;
  });

  // Params for adjustments
  const [resizeW, setResizeW] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "resize");
    return t?.width ?? 800;
  });
  const [resizeH, setResizeH] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "resize");
    return t?.height ?? 0;
  });
  const [cropX, setCropX] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "crop");
    return t?.x ?? 0;
  });
  const [cropY, setCropY] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "crop");
    return t?.y ?? 0;
  });
  const [cropW, setCropW] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "crop");
    return t?.width ?? 500;
  });
  const [cropH, setCropH] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "crop");
    return t?.height ?? 500;
  });
  const [watermarkText, setWatermarkText] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "watermark");
    return t?.text ?? "";
  });
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>(() => {
    const t = image?.transformations?.find((t) => t.type === "watermark");
    return (t?.position as WatermarkPosition) ?? "bottom-right";
  });
  const [logoUrl, setLogoUrl] = useState(() => {
    const t = image?.transformations?.find((t) => t.type === "watermark");
    return t?.logoUrl ?? "";
  });
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png">(() => {
    const t = image?.transformations?.find((t) => t.type === "format");
    return (t?.format as "jpeg" | "png") ?? "jpeg";
  });

  // Batch progress
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  function buildConfigs(): TransformConfig[] {
    const configs: TransformConfig[] = [];
    for (const def of [...EFFECTS, ...ADJUSTMENTS]) {
      if (!selected.has(def.id)) continue;
      switch (def.id) {
        case "resize":
          configs.push({ type: "resize", width: resizeW, height: resizeH });
          break;
        case "crop":
          configs.push({ type: "crop", x: cropX, y: cropY, width: cropW, height: cropH });
          break;
        case "watermark":
          configs.push({
            type: "watermark",
            text: logoUrl ? undefined : watermarkText,
            position: watermarkPos,
            logoUrl: logoUrl || undefined,
          });
          break;
        case "format":
          configs.push({ type: "format", format: outputFormat });
          break;
        default:
          configs.push({ type: def.id });
      }
    }
    return configs;
  }

  // Single image mutation
  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => transformImage(image!.id, buildConfigs()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      onClose();
    },
  });

  // Batch polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  function startPolling(batchId: string) {
    setActiveBatchId(batchId);
    setBatchProgress({ done: 0, total: imageIds!.length, failed: 0 });

    pollRef.current = setInterval(async () => {
      try {
        const status = await getBatchStatus(batchId);
        setBatchProgress({ done: status.completed + status.failed, total: status.total, failed: status.failed });

        if (status.status !== "processing") {
          stopPolling();
          queryClient.invalidateQueries({ queryKey: ["images"] });
          setTimeout(onClose, 1500);
        }
      } catch {
        // keep polling on transient errors
      }
    }, 1000);
  }

  function handleBatchResult(data: Awaited<ReturnType<typeof batchTransformImages>>) {
    if (isAsyncResult(data)) {
      startPolling(data.batchId);
    } else {
      // Sync result — complete immediately
      queryClient.invalidateQueries({ queryKey: ["images"] });
      setBatchProgress({ done: (data.succeeded?.length ?? 0) + (data.failed?.length ?? 0), total: (data.succeeded?.length ?? 0) + (data.failed?.length ?? 0), failed: data.failed?.length ?? 0 });
      setTimeout(onClose, 1000);
    }
  }

  // Batch transform mutation
  const { mutate: batchMutate, isPending: isBatchPending, isError: isBatchError } = useMutation({
    mutationFn: () => batchTransformImages(imageIds!, buildConfigs()),
    onSuccess: handleBatchResult,
  });

  // Batch revert mutation
  const { mutate: batchRevertMutate, isPending: isBatchRevertPending } = useMutation({
    mutationFn: () => batchRevertTransform(imageIds!),
    onSuccess: handleBatchResult,
  });

  const { mutate: revert, isPending: isReverting } = useMutation({
    mutationFn: () => revertTransform(image!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      onClose();
    },
  });

  const hasExistingTransforms = !isBatchMode && image?.transformations && image.transformations.length > 0;
  const isPolling = !!activeBatchId && batchProgress && batchProgress.done < batchProgress.total;
  const isBusy = isPending || isReverting || isBatchPending || isBatchRevertPending || !!isPolling;

  function toggle(id: TransformType) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const src = image ? (image.compressedUrl || "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-medium text-gray-800">
              {isBatchMode ? `Transform ${imageIds!.length} Images` : "Transform Image"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isBatchMode
                ? "Selected transforms will be applied to all selected images"
                : "Select effects and adjustments to apply"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview + Timeline / Batch info */}
          <div className="flex-1 p-4 flex flex-col bg-gray-50 min-h-[300px] overflow-y-auto">
            <div className="flex flex-col items-center justify-center flex-1">
              {isBatchMode ? (
                <>
                  <div className="w-24 h-24 flex items-center justify-center bg-indigo-50 rounded-2xl mb-3">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{imageIds!.length} images selected</p>
                  <p className="text-xs text-gray-400 mt-1">Same transforms will be applied to all</p>

                  {/* Batch progress */}
                  {batchProgress && (
                    <div className="mt-4 w-full max-w-xs">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Processing...</span>
                        <span>{batchProgress.done}/{batchProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all duration-300", batchProgress.failed > 0 ? "bg-amber-500" : "bg-indigo-500")}
                          style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                        />
                      </div>
                      {batchProgress.done === batchProgress.total && (
                        <p className="text-xs mt-2 text-center font-medium text-green-600">
                          Done! {batchProgress.failed > 0 && <span className="text-amber-600">({batchProgress.failed} failed)</span>}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : src ? (
                <img src={src} alt={image!.filename} className="max-w-full max-h-[30vh] object-contain rounded-lg" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              )}
              {!isBatchMode && <p className="text-xs text-gray-400 mt-2 truncate max-w-full">{image?.filename}</p>}
            </div>

            {/* Processing Timeline */}
            {!isBatchMode && image?.processingHistory && image.processingHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Processing Timeline</p>
                <div className="relative">
                  {image.processingHistory.map((step: ProcessingStep, i: number) => {
                    const meta = STEP_META[step.step] || STEP_META.uploaded;
                    const isLast = i === image.processingHistory!.length - 1;
                    return (
                      <div key={i} className="flex gap-3 relative">
                        {/* Vertical line */}
                        {!isLast && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                        )}
                        {/* Dot */}
                        <div className={cn("w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5", meta.color)}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
                          </svg>
                        </div>
                        {/* Content */}
                        <div className="pb-3 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">{meta.label}</span>
                            {step.durationMs > 0 && (
                              <span className="text-[10px] text-gray-400">{formatDuration(step.durationMs)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {step.sizeBytes > 0 && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{formatBytes(step.sizeBytes)}</span>
                            )}
                            {step.detail && (
                              <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded truncate">{step.detail}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-300 mt-0.5">
                            {new Date(step.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transform options */}
          <div className="w-72 border-l border-gray-100 flex flex-col overflow-y-auto">
            {/* Effects section */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Effects</p>
            </div>
            <div className="px-3 pb-3 space-y-1">
              {EFFECTS.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    disabled={isBusy}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                      isSelected ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-gray-50",
                      isBusy && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors border-2",
                      isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                    )}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", isSelected ? "text-indigo-700" : "text-gray-700")}>{t.label}</p>
                      <p className="text-[11px] text-gray-400">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Adjustments section */}
            <div className="px-4 pt-2 pb-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Adjustments</p>
            </div>
            <div className="px-3 pb-3 space-y-1">
              {ADJUSTMENTS.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <div key={t.id}>
                    <button
                      onClick={() => toggle(t.id)}
                      disabled={isBusy}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        isSelected ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-gray-50",
                        isBusy && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors border-2",
                        isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", isSelected ? "text-indigo-700" : "text-gray-700")}>{t.label}</p>
                        <p className="text-[11px] text-gray-400">{t.description}</p>
                      </div>
                    </button>

                    {/* Param inputs — shown when selected */}
                    {isSelected && (
                      <div className="ml-10 mr-3 mt-1.5 mb-2 space-y-2">
                        {t.id === "resize" && (
                          <div className="flex gap-2">
                            <label className="flex-1">
                              <span className="text-[10px] text-gray-400 uppercase">Width</span>
                              <input type="number" value={resizeW} onChange={(e) => setResizeW(+e.target.value)}
                                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" placeholder="800" />
                            </label>
                            <label className="flex-1">
                              <span className="text-[10px] text-gray-400 uppercase">Height</span>
                              <input type="number" value={resizeH} onChange={(e) => setResizeH(+e.target.value)}
                                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" placeholder="0 = auto" />
                            </label>
                          </div>
                        )}
                        {t.id === "crop" && (
                          <>
                            <div className="flex gap-2">
                              <label className="flex-1">
                                <span className="text-[10px] text-gray-400 uppercase">X</span>
                                <input type="number" value={cropX} onChange={(e) => setCropX(+e.target.value)}
                                  className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" />
                              </label>
                              <label className="flex-1">
                                <span className="text-[10px] text-gray-400 uppercase">Y</span>
                                <input type="number" value={cropY} onChange={(e) => setCropY(+e.target.value)}
                                  className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" />
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <label className="flex-1">
                                <span className="text-[10px] text-gray-400 uppercase">Width</span>
                                <input type="number" value={cropW} onChange={(e) => setCropW(+e.target.value)}
                                  className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" />
                              </label>
                              <label className="flex-1">
                                <span className="text-[10px] text-gray-400 uppercase">Height</span>
                                <input type="number" value={cropH} onChange={(e) => setCropH(+e.target.value)}
                                  className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" />
                              </label>
                            </div>
                          </>
                        )}
                        {t.id === "watermark" && (
                          <div className="space-y-2">
                            <label>
                              <span className="text-[10px] text-gray-400 uppercase">Text</span>
                              <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                                placeholder="Copyright 2024" disabled={!!logoUrl}
                                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none disabled:opacity-40" />
                            </label>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase">Or logo URL</span>
                              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none" />
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase">Position</span>
                              <div className="grid grid-cols-2 gap-1 mt-0.5">
                                {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => (
                                  <button key={pos} onClick={() => setWatermarkPos(pos)}
                                    className={cn(
                                      "px-2 py-1 text-[10px] font-medium rounded border transition-colors",
                                      watermarkPos === pos
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    )}>
                                    {pos.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {t.id === "format" && (
                          <div className="flex gap-2">
                            {(["jpeg", "png"] as const).map((fmt) => (
                              <button key={fmt} onClick={() => setOutputFormat(fmt)}
                                className={cn(
                                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                                  outputFormat === fmt
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                )}>
                                {fmt.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Currently applied + revert */}
            {hasExistingTransforms && (
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-400">Currently applied</p>
                  <button
                    onClick={() => revert()}
                    disabled={isBusy}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isReverting ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Reverting…
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                        </svg>
                        Revert to original
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {image.transformations!.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{t.type}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          <div>
            {(isError || isBatchError) ? (
              <p className="text-xs text-red-600 font-medium">Failed to apply transforms. Try again.</p>
            ) : isPolling ? (
              <p className="text-xs text-indigo-600 font-medium">Processing in background...</p>
            ) : (
              <p className="text-xs text-gray-400">
                {selected.size > 0
                  ? `${selected.size} transform${selected.size > 1 ? "s" : ""} selected`
                  : "Select transforms to apply"
                }
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isBatchMode && (
              <button
                onClick={() => batchRevertMutate()}
                disabled={isBusy}
                className="px-4 py-2 text-sm font-medium text-amber-600 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isBatchRevertPending && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                )}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                </svg>
                Revert All
              </button>
            )}
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              {isPolling ? "Close" : "Cancel"}
            </button>
            <button
              onClick={() => isBatchMode ? batchMutate() : mutate()}
              disabled={selected.size === 0 || isBusy}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {(isPending || isBatchPending || !!isPolling) && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {(isPending || isBatchPending)
                ? "Applying…"
                : isPolling
                  ? "Processing…"
                  : isBatchMode
                    ? `Apply to ${imageIds!.length} Images`
                    : "Apply"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
