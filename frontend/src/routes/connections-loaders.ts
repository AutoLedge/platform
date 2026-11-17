import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { queryClient } from "@/lib/query-client";
import { accountsQuery, plaidItemsQuery } from "@/queries/plaid";
import { handlePlaidIntent, readPlaidIntent } from "@/routes/plaid-actions";

// `/b/:businessId/connections`. The business loader above has already checked membership.
export async function connectionsLoader({ params }: LoaderFunctionArgs) {
  const businessId = params.businessId!;
  await Promise.all([
    queryClient.ensureQueryData(plaidItemsQuery(businessId)),
    queryClient.ensureQueryData(accountsQuery(businessId)),
  ]);
  return null;
}

// Connect, Refresh and Remove, submitted as JSON by the page's fetchers.
export async function connectionsAction({ request, params }: ActionFunctionArgs) {
  const payload = await readPlaidIntent(request);
  return handlePlaidIntent(params.businessId!, payload);
}
