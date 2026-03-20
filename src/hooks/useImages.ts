import { useQuery } from "@tanstack/react-query";
import { getImages } from "../api/images";

export function useImages(
  page: number,
  limit: number,
  search: string,
  status: string
) {
  return useQuery({
    queryKey: ["images", page, limit, search, status],
    queryFn: () => getImages(page, limit, search, status),
    refetchInterval: (query) => {
      const images = query.state.data?.images ?? [];
      // Only poll while any image is still processing
      return (images ?? []).some((img) => img.status === "processing")
        ? 5000
        : false;
    },
  });
}
