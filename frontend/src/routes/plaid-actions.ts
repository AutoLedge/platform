import { ApiError, apiErrorMessage, apiFetch, type Schemas } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { invalidateBankData } from "@/queries/plaid";

// Shared Plaid write logic. Route actions call it with their own business id, so the
// Connections page and onboarding (N18) run the same code. Never log the payload: it
// carries Plaid's public_token.

export type PlaidIntent =
  | { intent: "link-token" }
  | { intent: "connect"; public_token: string; institution_id?: string }
  | { intent: "refresh"; item_id: string }
  | { intent: "remove"; item_id: string };

export type PlaidActionResult =
  | { ok: true; intent: "link-token"; linkToken: string }
  | { ok: true; intent: "connect" }
  | { ok: true; intent: "refresh"; itemId: string; added: number; modified: number; removed: number }
  | { ok: true; intent: "remove"; itemId: string }
  | { ok: false; intent: string; itemId?: string; error: string };

/** Errors each intent shows inline; anything else goes to the error boundary. */
const INLINE_STATUSES: Record<PlaidIntent["intent"], number[]> = {
  "link-token": [400, 409, 422, 502],
  connect: [400, 409, 422, 502],
  refresh: [409, 502],
  remove: [409, 502],
};

/** Reads a JSON request body as a PlaidIntent, or answers 400 when it isn't one. */
export async function readPlaidIntent(request: Request): Promise<PlaidIntent> {
  const body: unknown = await request.json().catch(() => null);
  const value = (body ?? {}) as Record<string, unknown>;
  const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0;

  switch (value.intent) {
    case "link-token":
      return { intent: "link-token" };
    case "connect":
      if (!isText(value.public_token)) break;
      return isText(value.institution_id)
        ? { intent: "connect", public_token: value.public_token, institution_id: value.institution_id }
        : { intent: "connect", public_token: value.public_token };
    case "refresh":
    case "remove":
      if (!isText(value.item_id)) break;
      return { intent: value.intent, item_id: value.item_id };
  }
  throw new Response("Bad request", { status: 400 });
}

export async function handlePlaidIntent(
  businessId: string,
  payload: PlaidIntent,
): Promise<PlaidActionResult> {
  const base = `/businesses/${encodeURIComponent(businessId)}/plaid`;
  const itemId = "item_id" in payload ? payload.item_id : undefined;
  const itemPath = itemId ? `${base}/items/${encodeURIComponent(itemId)}` : "";

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
      case "refresh": {
        const { added, modified, removed } = await apiFetch<Schemas["SyncResponse"]>(`${itemPath}/sync`, {
          method: "POST",
        });
        await invalidateBankData(queryClient, businessId);
        return { ok: true, intent: "refresh", itemId: payload.item_id, added, modified, removed };
      }
      case "remove": {
        await apiFetch<void>(itemPath, { method: "DELETE" });
        await invalidateBankData(queryClient, businessId);
        return { ok: true, intent: "remove", itemId: payload.item_id };
      }
    }
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // The connection is gone: show the list as it is now.
    if (error.status === 404 && (payload.intent === "refresh" || payload.intent === "remove")) {
      await invalidateBankData(queryClient, businessId);
      return payload.intent === "remove"
        ? { ok: true, intent: "remove", itemId: payload.item_id }
        : { ok: false, intent: "refresh", itemId, error: "This connection no longer exists." };
    }

    if (INLINE_STATUSES[payload.intent].includes(error.status)) {
      // A refused sync may have just recorded Needs attention on the connection, so
      // reload it on any 409 rather than matching the API's wording.
      if (payload.intent === "refresh" && error.status === 409) {
        await invalidateBankData(queryClient, businessId);
      }
      return { ok: false, intent: payload.intent, itemId, error: apiErrorMessage(error) };
    }
    throw error;
  }
}
