import api from "./axios";
import axios from "axios";
import type { APIResponse, Image, PaginatedImages, StorageInfo, TransformConfig } from "../types";

export async function getImages(cursor = "", limit = 20, search = "", status = "") {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const res = await api.get<APIResponse<PaginatedImages>>(`/images?${params.toString()}`);
  return res.data.data;
}

// ─── Presigned upload ─────────────────────────────────────────────────────────

export interface PreparedFile {
  key: string;
  uploadUrl: string;
  filename: string;
  requestId: string;
}

export async function prepareUpload(
  files: { filename: string; contentType: string; size: number }[]
): Promise<PreparedFile[]> {
  const res = await api.post<APIResponse<PreparedFile[]>>("/images/prepare", { files });
  return res.data.data ?? [];
}

// PUT directly to S3 — bypasses the API server entirely.
// Returns the same key so the caller can confirm. Retries once on 403 (expired URL).
export async function putToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
}

export async function confirmUpload(
  files: { key: string; filename: string; requestId: string }[],
  idempotencyKey: string
): Promise<void> {
  await api.post(
    "/images/confirm",
    { files },
    { headers: { "X-Idempotency-Key": idempotencyKey } }
  );
}

export async function deleteImage(id: string) {
  const res = await api.delete(`/image/${id}`);
  return res.data;
}

export async function batchDeleteImages(ids: string[]) {
  const res = await api.delete<APIResponse<{ deleted: string[]; failed: string[] }>>("/images", {
    data: { ids },
  });
  return res.data.data;
}

// ─── Transforms ─────────────────────────────────────────────────────────────

export async function transformImage(imageId: string, transformations: TransformConfig[]) {
  const res = await api.post<APIResponse<Image>>(`/images/${imageId}/transform`, { transformations });
  return res.data;
}

export type BatchSyncResult = { succeeded: { id: string; error?: string }[]; failed: { id: string; error?: string }[] };
export type BatchAsyncResult = { batchId: string; total: number };
export type BatchResult = BatchSyncResult | BatchAsyncResult;

function isAsyncResult(data: BatchResult): data is BatchAsyncResult {
  return "batchId" in data;
}

export { isAsyncResult };

export async function batchTransformImages(ids: string[], transformations: TransformConfig[]): Promise<BatchResult> {
  const res = await api.post<APIResponse<BatchResult>>("/images/batch-transform", { ids, transformations });
  return res.data.data!;
}

export async function batchRevertTransform(ids: string[]): Promise<BatchResult> {
  const res = await api.post<APIResponse<BatchResult>>("/images/batch-revert-transform", { ids });
  return res.data.data!;
}

export interface BatchStatus {
  id: string;
  type: string;
  total: number;
  completed: number;
  failed: number;
  status: "processing" | "completed" | "partial" | "failed";
  errors?: { imageId: string; error: string }[];
}

export async function getBatchStatus(batchId: string) {
  const res = await api.get<APIResponse<BatchStatus>>(`/batches/${batchId}`);
  return res.data.data;
}

export async function revertTransform(imageId: string) {
  const res = await api.post<APIResponse<Image>>(`/images/${imageId}/revert-transform`);
  return res.data;
}

export async function cancelTransform(imageId: string) {
  const res = await api.post<APIResponse<null>>(`/images/${imageId}/cancel-transform`);
  return res.data;
}

// ─── Storage ────────────────────────────────────────────────────────────────

export async function getStorageInfo() {
  const res = await api.get<APIResponse<StorageInfo>>("/storage");
  return res.data.data;
}
