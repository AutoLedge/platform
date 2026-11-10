import { queryOptions } from "@tanstack/react-query";
import { apiFetch, type Schemas } from "@/lib/api";

// Every business-scoped query key starts with businessKeys.detail(id) or includes the id,
// so two businesses' data never share a cache entry.
export const businessKeys = {
  all: ["businesses"] as const,
  list: () => ["businesses", "list"] as const,
  detail: (id: string) => ["businesses", "detail", id] as const,
};

export const businessListQuery = () =>
  queryOptions({
    queryKey: businessKeys.list(),
    queryFn: ({ signal }) => apiFetch<Schemas["BusinessResponse"][]>("/businesses", { signal }),
  });

export const businessQuery = (id: string) =>
  queryOptions({
    queryKey: businessKeys.detail(id),
    queryFn: ({ signal }) =>
      apiFetch<Schemas["BusinessResponse"]>(`/businesses/${encodeURIComponent(id)}`, { signal }),
  });
