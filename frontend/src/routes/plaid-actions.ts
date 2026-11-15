import { ApiError, apiErrorMessage, apiFetch, type Schemas } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { invalidateBankData } from "@/queries/plaid";

// Shared Plaid write logic. Route actions call it with their own business id, so the
// Connections page and onboarding (N18) run the same code. Never log the payload: it
// carries Plaid's public_token.

export type PlaidIntent =
  | { intent: "link-token" }
  | { intent: "connect"; public_token: string; institution_id?: string };

export type PlaidActionResult =
  | { ok: true; intent: "link-token"; linkToken: string }
  | { ok: true; intent: "connect" }
  | { ok: false; intent: string; error: string };

/** Errors the page shows inline; anything else goes to the error boundary. */
const INLINE_STATUSES = [400, 409, 422, 502];

function isInline(error: unknown): error is ApiError {
  return error instanceof ApiError && INLINE_STATUSES.includes(error.status);
}

export async function handlePlaidIntent(
  businessId: string,
  payload: PlaidIntent,
): Promise<PlaidActionResult> {
  const base = `/businesses/${encodeURIComponent(businessId)}/plaid`;

  try {
    switch (payload.intent) {
      case "link-token": {
        const { link_token } = await apiFetch<Schemas["LinkTokenResponse"]>(`${base}/link-token`, {
          method: "POST",
        });
        return { ok: true, intent: "link-token", linkToken: link_token };
      }
      case "connect": {
        const body: Schemas["PlaidItemCreate"] = { public_token: payload.public_token };
        if (payload.institution_id) body.institution_id = payload.institution_id;
        await apiFetch<Schemas["PlaidItemResponse"]>(`${base}/items`, { method: "POST", json: body });
        await invalidateBankData(queryClient, businessId);
        return { ok: true, intent: "connect" };
      }
      default:
        throw new Response("Unknown intent", { status: 400 });
    }
  } catch (error) {
    if (isInline(error)) return { ok: false, intent: payload.intent, error: apiErrorMessage(error) };
    throw error;
  }
}
