import { redirect, type LoaderFunctionArgs } from "react-router";
import { queryClient } from "@/lib/query-client";
import { readLastBusinessId, writeLastBusinessId } from "@/lib/last-business";
import { businessListQuery, businessQuery } from "@/queries/businesses";

// `/`: send the user to their business, or show the choose / pick page.
export async function homeLoader() {
  const businesses = await queryClient.ensureQueryData(businessListQuery());
  if (businesses.length === 1) throw redirect(`/b/${businesses[0].id}`);
  if (businesses.length > 1) {
    const last = readLastBusinessId();
    if (last && businesses.some((b) => b.id === last)) throw redirect(`/b/${last}`);
  }
  return { businesses };
}

// `/b/:businessId`: a business the user isn't a member of is a 404 → ErrorPage "Not found".
export async function businessLoader({ params }: LoaderFunctionArgs) {
  const business = await queryClient.ensureQueryData(businessQuery(params.businessId!));
  writeLastBusinessId(business.id);
  return { business };
}
