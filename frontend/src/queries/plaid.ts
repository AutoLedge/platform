import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { apiFetch, type Schemas } from "@/lib/api";
import { businessKeys } from "@/queries/businesses";
import { transactionKeys } from "@/queries/transactions";

export const plaidKeys = {
  items: (businessId: string) => [...businessKeys.detail(businessId), "plaid", "items"] as const,
  accounts: (businessId: string) => [...businessKeys.detail(businessId), "accounts"] as const,
};

/** The business's bank connections, newest first. */
export const plaidItemsQuery = (businessId: string) =>
  queryOptions({
    queryKey: plaidKeys.items(businessId),
    queryFn: ({ signal }) =>
      apiFetch<Schemas["PlaidItemResponse"][]>(
        `/businesses/${encodeURIComponent(businessId)}/plaid/items`,
        { signal },
      ),
  });

/** Every account of the business, including disconnected ones. */
export const accountsQuery = (businessId: string) =>
  queryOptions({
    queryKey: plaidKeys.accounts(businessId),
    queryFn: ({ signal }) =>
      apiFetch<Schemas["AccountResponse"][]>(
        `/businesses/${encodeURIComponent(businessId)}/accounts`,
        { signal },
      ),
  });

/** After connect, remove or refresh: everything bank-related for this business. */
export async function invalidateBankData(client: QueryClient, businessId: string): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: plaidKeys.items(businessId) }),
    client.invalidateQueries({ queryKey: plaidKeys.accounts(businessId) }),
    client.invalidateQueries({ queryKey: transactionKeys.all(businessId) }),
  ]);
}
