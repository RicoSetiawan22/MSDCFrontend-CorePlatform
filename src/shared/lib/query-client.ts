import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data dianggap "segar" 30 detik - tidak refetch tiap kali komponen re-render dalam rentang itu
      retry: 1, // API di-retry maksimal 1x kalau gagal (bukan default 3x TanStack Query - lebih cepat kasih tahu user kalau memang error)
      refetchOnWindowFocus: false, // ERP internal, bukan app real-time - tidak perlu refetch tiap kali user balik ke tab ini
    },
  },
});
