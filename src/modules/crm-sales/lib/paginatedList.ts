interface ListPage<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

/** Handle both a full list and an already paginated API response without slicing twice. */
export function resolveListPage<T>(payload: unknown, page = 1, perPage = 10): ListPage<T> {
  const requestedPage = Math.max(1, Math.floor(page) || 1);
  const size = Math.max(1, Math.floor(perPage) || 1);
  let value = payload;

  // CRM endpoints may wrap a paginator inside a success/data envelope.
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(value)) {
      const total = value.length;
      const lastPage = Math.max(1, Math.ceil(total / size));
      const currentPage = Math.min(requestedPage, lastPage);
      return {
        data: value.slice((currentPage - 1) * size, currentPage * size) as T[],
        total,
        current_page: currentPage,
        last_page: lastPage,
      };
    }

    if (!value || typeof value !== "object") break;
    const result = value as Record<string, unknown>;
    if (Array.isArray(result.data) && (
      result.current_page != null || result.last_page != null || result.per_page != null
    )) {
      const total = Math.max(0, Number(result.total ?? result.data.length) || 0);
      const actualSize = Math.max(1, Number(result.per_page) || size);
      return {
        data: result.data as T[],
        total,
        current_page: Math.max(1, Number(result.current_page) || requestedPage),
        last_page: Math.max(1, Number(result.last_page) || Math.ceil(total / actualSize)),
      };
    }
    value = result.data;
  }

  return { data: [], total: 0, current_page: 1, last_page: 1 };
}
