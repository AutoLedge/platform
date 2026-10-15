import { redirect } from "react-router";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";

// No page of its own. Triggered by <Form method="post" action="/logout">.
// POST means a link prefetch can't log anyone out by accident.
export async function logoutAction() {
  await supabase.auth.signOut();
  queryClient.clear(); // Clear the query cache on logout
  throw redirect("/login");
}