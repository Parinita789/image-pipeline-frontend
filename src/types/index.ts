export interface ProcessingStep {
  step: "uploaded" | "compressed" | "transformed" | "reverted";
  sizeBytes: number;
  durationMs: number;
  detail?: string;
  timestamp: string;
}

export interface Image {
  id: string;
  userId: string;
  filename: string;
  originalUrl: string;
  compressedUrl: string;
  transformations?: TransformConfig[];
  transformedUrl?: string;
  originalSize: number;
  compressedSize: number;
  processingHistory?: ProcessingStep[];
  status: "processing" | "compressed" | "failed";
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

export interface StorageInfo {
  usedBytes: number;
  limitBytes: number;
  usedPercent: number;
}

export type TransformType = "grayscale" | "sepia" | "blur" | "sharpen" | "invert" | "remove-bg" | "resize" | "crop" | "watermark" | "format";

export type WatermarkPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface TransformConfig {
  type: TransformType;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  text?: string;
  format?: "jpeg" | "png";
  position?: WatermarkPosition;
  logoUrl?: string;
}

export interface APIResponse<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

export interface PaginatedImages {
  images: Image[] | null;
  total: number;
  nextCursor?: string;
  limit: number;
}

export interface LoginResponse {
  token: string;
}
