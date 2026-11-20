import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { queryClient } from "@/lib/query-client";
import { accountsQuery, plaidItemsQuery } from "@/queries/plaid";
import { handlePlaidIntent, readPlaidIntent } from "@/routes/connections/plaid-actions";

// `/b/:businessId/connections`. The business loader above has already checked membership.
// Render-as-you-fetch: start the queries without awaiting them; the page's Suspense boundaries
// show skeletons until they resolve (see transactions-loaders.ts).
export function connectionsLoader({ params }: LoaderFunctionArgs) {
  const businessId = params.businessId!;
  void queryClient.prefetchQuery(plaidItemsQuery(businessId));
  void queryClient.prefetchQuery(accountsQuery(businessId));
  return null;
}

// Connect, Refresh and Remove, submitted as JSON by the page's fetchers.
export async function connectionsAction({ request, params }: ActionFunctionArgs) {
  const payload = await readPlaidIntent(request);
  return handlePlaidIntent(params.businessId!, payload);
}
