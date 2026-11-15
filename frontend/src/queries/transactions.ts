import { infiniteQueryOptions } from "@tanstack/react-query";
import { apiFetch, type Schemas } from "@/lib/api";
import { businessKeys } from "@/queries/businesses";

/** Filters for GET …/transactions, named as the API names them. */
export type TransactionFilters = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  account_id?: string;
  pending?: "true" | "false";
  q?: string;
};

const FILTER_NAMES = ["from", "to", "account_id", "pending", "q"] as const;

/** Drops empty values so `{}` and `{q: ""}` share one cache entry. */
function normaliseFilters(filters: TransactionFilters): TransactionFilters {
  const result: TransactionFilters = {};
  for (const name of FILTER_NAMES) {
    const value = filters[name];
    if (value) (result as Record<string, string>)[name] = value;
  }
  return result;
}

export const transactionKeys = {
  all: (businessId: string) => [...businessKeys.detail(businessId), "transactions"] as const,
  list: (businessId: string, filters: TransactionFilters) =>
    [...transactionKeys.all(businessId), normaliseFilters(filters)] as const,
};

export const transactionsQuery = (businessId: string, filters: TransactionFilters) => {
  const normalised = normaliseFilters(filters);
  return infiniteQueryOptions({
    queryKey: transactionKeys.list(businessId, normalised),
    queryFn: ({ signal, pageParam }) => {
      const params = new URLSearchParams();
      for (const name of FILTER_NAMES) {
        const value = normalised[name];
        if (value) params.set(name, value);
      }
      if (pageParam) params.set("cursor", pageParam);
      const search = params.toString();
      const query = search ? `?${search}` : "";
      return apiFetch<Schemas["TransactionPage"]>(
        `/businesses/${encodeURIComponent(businessId)}/transactions${query}`,
        { signal },
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
};
