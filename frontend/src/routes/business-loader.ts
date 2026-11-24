import type { LoaderFunctionArgs } from "react-router";
import { queryClient } from "@/lib/query-client";
import { writeLastBusinessId } from "@/lib/last-business";
import { businessQuery } from "@/queries/businesses";

// `/b/:businessId`: the guard for every business page. A business the user isn't a member of
// is a 404 → ErrorPage "Not found".
export async function businessLoader({ params }: LoaderFunctionArgs) {
  const business = await queryClient.ensureQueryData(businessQuery(params.businessId!));
  writeLastBusinessId(business.id);
  return { business };
}
