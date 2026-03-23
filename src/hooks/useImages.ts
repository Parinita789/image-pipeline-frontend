import { useQuery } from "@tanstack/react-query";
import { getImages } from "../api/images";

export function useImages(
  cursor: string,
  limit: number,
  search: string,
  status: string,
  refreshKey: number
) {
  return useQuery({
    queryKey: ["images", cursor, limit, search, status, refreshKey],
    queryFn: () => getImages(cursor, limit, search, status),
    refetchInterval: (query) => {
      const images = query.state.data?.images ?? [];
      // Only poll while any image is still processing
      return (images ?? []).some((img) => img.status === "processing")
        ? 2000
        : false;
    },
  });
}
