import type { LoaderFunctionArgs } from "react-router";
import { queryClient } from "@/lib/query-client";
import { accountsQuery } from "@/queries/plaid";
import { transactionsQuery, type TransactionFilters } from "@/queries/transactions";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in YYYY-MM-DD form (2026-02-30 is not). */
function isDate(value: string | null): value is string {
  if (!value || !DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** The filters the URL carries, keeping only values the API accepts. Everything else is ignored. */
export function parseTransactionFilters(params: URLSearchParams): TransactionFilters {
  const filters: TransactionFilters = {};
  const from = params.get("from");
  const to = params.get("to");
  const accountId = params.get("account_id");
  const pending = params.get("pending");
  const q = params.get("q")?.trim().slice(0, 100);

  if (isDate(from)) filters.from = from;
  if (isDate(to)) filters.to = to;
  if (accountId) filters.account_id = accountId;
  if (pending === "true" || pending === "false") filters.pending = pending;
  if (q) filters.q = q;
  return filters;
}

// `/b/:businessId/transactions`. The business loader above has already checked membership.
export async function transactionsLoader({ request, params }: LoaderFunctionArgs) {
  const businessId = params.businessId!;
  const filters = parseTransactionFilters(new URL(request.url).searchParams);
  // The API answers 422 for this; say so on the page instead of asking.
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  await Promise.all([
    queryClient.ensureQueryData(accountsQuery(businessId)),
    invalidRange ? null : queryClient.ensureInfiniteQueryData(transactionsQuery(businessId, filters)),
  ]);
  return { filters, invalidRange };
}
