export interface Image {
  id: string;
  userId: string;
  filename: string;
  originalUrl: string;
  compressedUrl: string;
  transformations?: string[];
  transformedUrl?: string;
  originalSize: number;
  compressedSize: number;
  status: "processing" | "compressed";
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

export type TransformType = "grayscale" | "sepia" | "blur" | "sharpen" | "invert";

export interface APIResponse<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

export interface PaginatedImages {
  images: Image[] | null;
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  token: string;
}
