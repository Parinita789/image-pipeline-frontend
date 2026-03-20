import { useQuery } from "@tanstack/react-query";
import { getStorageInfo } from "../api/images";

export function useStorage() {
  return useQuery({
    queryKey: ["storage"],
    queryFn: getStorageInfo,
    staleTime: 30_000,
  });
}
