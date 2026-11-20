import { useLocation, useNavigate, useParams } from "react-router";
import type { TransactionFilters } from "@/queries/transactions";

type FilterChanges = Partial<Record<keyof TransactionFilters, string | undefined>>;

/**
 * Filters live in the URL (GET semantics): back/forward and shared links work, and a new filter
 * starts from the first page because the URL never carries a cursor. Empty values are dropped,
 * so a cleared filter leaves the URL instead of lingering as `?q=`.
 */
export function useFilterUrl() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const pagePath = `/b/${useParams().businessId!}/transactions`;

  const href = (changes: FilterChanges) => {
    const params = new URLSearchParams(search);
    for (const [name, value] of Object.entries(changes)) {
      if (value?.trim()) params.set(name, value.trim());
      else params.delete(name);
    }
    const query = params.toString();
    return query ? `${pagePath}?${query}` : pagePath;
  };

  return {
    pagePath,
    href,
    apply: (changes: FilterChanges) => navigate(href(changes)),
  };
}
