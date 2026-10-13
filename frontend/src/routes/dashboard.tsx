import { Form, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { sessionContext } from "../lib/auth";
import { apiFetch } from "../lib/api";
import { queryClient } from "../lib/query-client";

type DashboardSummary = {
  cash_balance: string;
  unmatched_transaction_count: number;
};

// Defined once and shared by the loader and the component.
const dashboardSummaryQuery = queryOptions({
  queryKey: ["dashboard", "summary"],
  queryFn: ({ signal }) => apiFetch<DashboardSummary>("/dashboard/summary", { signal }),
});

export async function dashboardLoader({ context }: LoaderFunctionArgs) {
  // Start (or reuse) the fetch before the page renders. Instant if cached.
  await queryClient.ensureQueryData(dashboardSummaryQuery);
  return { email: context.get(sessionContext).user.email };
}

export default function Dashboard() {
  const { email } = useLoaderData<typeof dashboardLoader>();
  const { data: summary } = useSuspenseQuery(dashboardSummaryQuery); // already loaded

  return (
    <main>
      <header>
        <span>Signed in as {email}</span>
        <Form method="post" action="/logout">
          <button type="submit">Log out</button>
        </Form>
      </header>

      <h1>Dashboard</h1>
      <p>Cash balance: {summary.cash_balance}</p>
      <p>Unmatched transactions: {summary.unmatched_transaction_count}</p>
    </main>
  );
}