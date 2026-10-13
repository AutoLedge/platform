import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number; // 0 = network error (server unreachable)
  constructor(status: number) {
    super(status === 0 ? "Network error" : `API request failed: ${status}`);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ApiError(401);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);

  let res: Response;
  try {
    res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, { ...init, headers });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e; // cancelled, not a failure
    throw new ApiError(0);
  }

  if (res.status === 401) {
    await supabase.auth.signOut(); // the listener in main.tsx redirects to /login
    throw new ApiError(401);
  }
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}