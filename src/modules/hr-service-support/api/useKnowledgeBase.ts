import { useQuery } from "@tanstack/react-query";
import { kbApi } from "./kbApi";

export function useKbArticles(params?: Parameters<typeof kbApi.list>[0]) {
  return useQuery({
    queryKey: ["kbArticles", params] as const,
    queryFn: () => kbApi.list(params).then((r) => r.data),
  });
}

export function useKbCategories() {
  return useQuery({
    queryKey: ["kbCategories"] as const,
    queryFn: () => kbApi.categories().then((r) => r.data.data),
  });
}

export function useKbSearch(q: string) {
  return useQuery({
    queryKey: ["kbSearch", q] as const,
    queryFn: () => kbApi.search(q).then((r) => r.data.data),
    enabled: q.length >= 3,
  });
}
