import { redirect, type ActionFunctionArgs } from "react-router";
import { ApiError, apiErrorMessage, apiFetch, type Schemas } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { clearDraft, readDraft } from "@/lib/onboarding-draft";
import { businessKeys } from "@/queries/businesses";

// Steps 2 and 3 need a name from step 1.
export function requireDraftLoader() {
  const draft = readDraft();
  if (!draft.name.trim()) throw redirect("/onboarding/business");
  return { draft };
}

// Finish setup: the only place onboarding calls the API.
export async function finishSetupAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();

  let business: Schemas["BusinessResponse"];
  try {
    business = await apiFetch<Schemas["BusinessResponse"]>("/businesses", {
      method: "POST",
      json: { name } satisfies Schemas["BusinessCreate"],
    });
  } catch (error) {
    // Validation problems stay on the page with the draft; anything else goes to the error page.
    if (error instanceof ApiError && error.status === 422) return { error: apiErrorMessage(error) };
    throw error;
  }

  await queryClient.invalidateQueries({ queryKey: businessKeys.all });
  clearDraft();
  throw redirect(`/b/${business.id}`);
}
