import type { components } from "@/lib/api-schema";
import { supabase } from "./supabase";

// Generated request/response types, e.g. Schemas["BusinessResponse"], Schemas["BusinessCreate"].
export type Schemas = components["schemas"];

export class ApiError extends Error {
  status: number; // 0 = network error (server unreachable)
  detail: unknown; // FastAPI's parsed `detail`, or null when the body had none
  constructor(status: number, detail: unknown = null) {
    super(status === 0 ? "Network error" : `API request failed: ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

/** First human-readable message from a FastAPI error (422 lists, or a string). */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (!(error instanceof ApiError)) return fallback;
  const { detail } = error;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") return item.msg;
    }
  }
  return fallback;
}

export type ApiFetchInit = RequestInit & {
  /** Serialised with JSON.stringify and sent as application/json. Use `body` for anything else. */
  json?: unknown;
};

async function readDetail(res: Response): Promise<unknown> {
  try {
    const body: unknown = await res.json();
    return body && typeof body === "object" && "detail" in body ? body.detail : null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    return null; // empty or non-JSON error body
  }
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  if (!supabase) throw new ApiError(401);
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ApiError(401);

  const { json, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    requestInit.body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, { ...requestInit, headers });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e; // cancelled, not a failure
    throw new ApiError(0);
  }

  if (res.status === 401) {
    await supabase.auth.signOut(); // the listener in main.tsx redirects to /login
    throw new ApiError(401);
  }
  if (!res.ok) throw new ApiError(res.status, await readDetail(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
