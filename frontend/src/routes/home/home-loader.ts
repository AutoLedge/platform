import { redirect } from "react-router";
import { queryClient } from "@/lib/query-client";
import { readLastBusinessId } from "@/lib/last-business";
import { businessListQuery } from "@/queries/businesses";

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
