import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productCategoryApi, productApi, promoPackageApi } from "./productApi";
import type { ProductCategory, Product, PromoPackage } from "../types/product";

// unwrapList: extract items array from Laravel API responses
// Laravel paginate: r = { success, data: { current_page, data: [items], total } }
// Laravel get/flat:  r = { success, data: [items] }
// Laravel Eloquent Collection: r = { success, data: Collection }
// Axios wraps:       axiosResponse = { data: <above> }
function unwrapList<T>(r: unknown): T[] {
  if (!r || typeof r !== 'object') return [];
  const body = (r as { data: unknown }).data;
  if (!body || typeof body !== 'object') return [];
  // Step into Laravel paginator: { success, data: { current_page, data: [], total } }
  const laravelBody = body as { success?: unknown; data: unknown };
  const maybePaginator = laravelBody.data;
  if (maybePaginator && typeof maybePaginator === 'object') {
    // Handle Eloquent Collection: has .toArray() or similar
    const coll = maybePaginator as { items?: unknown[]; all?: () => unknown[]; toArray?: () => unknown[] };
    if (Array.isArray(coll.items)) return coll.items as T[];
    if (typeof coll.all === 'function') return coll.all() as T[];
    if (typeof coll.toArray === 'function') return coll.toArray() as T[];
    // Try direct array
    const paginator = maybePaginator as { data: unknown };
    if (Array.isArray(paginator.data)) return paginator.data as T[];
  }
  // Fallback: direct array in data.data
  if (Array.isArray(laravelBody.data)) return laravelBody.data as T[];
  return [];
}

// ── Product Category ──
const categoryKeys = { all: ["productCategories"] as const };
export function useProductCategoryList() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => {
      try {
        const r = await productCategoryApi.list();
        const result = unwrapList<ProductCategory>(r as unknown);
        console.log("[categories] fetched:", result.length, result.slice(0,2).map(c => c.name));
        return result;
      } catch (e) {
        console.error("[categories] fetch error:", e);
        return [];
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductCategory>) => productCategoryApi.create(data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
export function useUpdateProductCategory(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductCategory>) => productCategoryApi.update(id, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catId: number) => productCategoryApi.delete(catId).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// ── Product ──
const productKeys = { all: ["products"] as const };
export function useProductList(params?: { search?: string; category_id?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: [...productKeys.all, params ?? {}],
    queryFn: () => productApi.list(params).then(r => unwrapList<Product>(r as unknown)),
  });
}
export function usePaginatedProductList(params: {
  search?: string;
  category_id?: number;
  is_active?: boolean;
  page: number;
  per_page: number;
}) {
  return useQuery({
    queryKey: [...productKeys.all, "paginated", params],
    queryFn: async () => {
      const response = await productApi.list(params);
      const payload: unknown = response.data.data;
      const page = Math.max(1, params.page);
      const perPage = Math.max(1, params.per_page);

      if (Array.isArray(payload)) {
        const total = payload.length;
        return {
          data: (payload as Product[]).slice(
            (page - 1) * perPage, page * perPage
          ),
          total,
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / perPage)),
        };
      }

      if (payload && typeof payload === "object") {
        const p = payload as {
          data?: unknown;
          total?: number;
          current_page?: number;
          last_page?: number;
        };

        if (Array.isArray(p.data)) {
          const total = Number(p.total ?? p.data.length);
          return {
            data: (p.data as Product[]).slice(0, perPage),
            total,
            current_page: Number(p.current_page ?? page),
            last_page: Number(
              p.last_page ?? Math.max(1, Math.ceil(total / perPage))
            ),
          };
        }
      }

      return {
        data: [] as Product[],
        total: 0,
        current_page: 1,
        last_page: 1,
      };
    },
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: [...productKeys.all, "detail", id ?? 0] as const,
    queryFn: () => productApi.show(id!).then(r => r.data.data),
    enabled: !!id,
  });
}
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => productApi.create(data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
export function useUpdateProduct(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => productApi.update(id, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

// ── Promo Package ──
const promoKeys = { all: ["promoPackages"] as const, list: (p: Record<string, unknown>) => [...promoKeys.all, p] };

interface PromoPackageListResult {
  packages: PromoPackage[];
  total: number;
  current_page: number;
  last_page: number;
}

export function usePromoPackageList(params?: {
  search?: string; status?: string; date_from?: string; date_to?: string;
  page?: number; per_page?: number;
}) {
  return useQuery({
    queryKey: promoKeys.list(params ?? {}),
    queryFn: (): Promise<PromoPackageListResult> =>
      promoPackageApi.list(params).then(r => {
        const raw = r.data as unknown;
        // Handle nested: { data: { data: [], total: N } }
        if (raw && typeof raw === 'object' && 'data' in raw) {
          const inner = (raw as { data: unknown }).data;
          if (inner && typeof inner === 'object' && 'data' in inner) {
            const d = (inner as { data: unknown }).data;
            const t = (inner as { total?: number }).total ?? 0;
            const cp = (inner as { current_page?: number }).current_page ?? 1;
            const lp = (inner as { last_page?: number }).last_page ?? 1;
            return {
              packages: Array.isArray(d) ? d as PromoPackage[] : [],
              total: t, current_page: cp, last_page: lp,
            };
          }
        }
        // Handle flat: { data: [] }
        if (Array.isArray(raw)) {
          return { packages: raw as PromoPackage[], total: raw.length, current_page: 1, last_page: 1 };
        }
        return { packages: [], total: 0, current_page: 1, last_page: 1 };
      }),
    placeholderData: (prev) => prev,
  });
}
// Session-scoped key: includes timestamp bucket so stale empty cache from
// previous session (when no packages were active) is never reused.
export function useActivePromoPackages() {
  return useQuery({
    queryKey: ["productPackages", "active", Math.floor(Date.now() / 30000)],
    queryFn: () => promoPackageApi.active().then(r => unwrapList<PromoPackage>(r)),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
export function usePromoPackage(id: number | undefined) {
  return useQuery({
    queryKey: [...promoKeys.all, "detail", id ?? 0] as const,
    queryFn: () => promoPackageApi.show(id!).then(r => (r.data as { data: PromoPackage }).data),
    enabled: !!id,
  });
}
export function useCreatePromoPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof promoPackageApi.create>[0]) =>
      promoPackageApi.create(data as any).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}
export function useUpdatePromoPackage(id: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof promoPackageApi.update>[1]) => {
      if (id === undefined) throw new Error("Package ID is required for update");
      return promoPackageApi.update(id, data as any).then(r => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}
export function useActivatePromoPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promoPackageApi.activate(id).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}
export function useDeletePromoPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promoPackageApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}
