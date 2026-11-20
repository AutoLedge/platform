import type { LoaderFunctionArgs } from "react-router";
import { sessionContext } from "@/lib/auth";

export type DashboardUser = {
  name: string;
  email: string;
};

export async function dashboardLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(sessionContext).user;
  const metadata = user.user_metadata;
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name : "";
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const email = user.email ?? "";

  return {
    user: {
      name: `${firstName} ${lastName}`.trim() || metadataName || email || "AutoLedge User",
      email,
    } satisfies DashboardUser,
  };
}

/** `handle` on each route: the page name shown in the top bar breadcrumb. */
export type RouteHandle = { title?: string };
