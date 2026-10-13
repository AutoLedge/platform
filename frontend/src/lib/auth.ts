import { createContext, redirect, type MiddlewareFunction } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Middleware puts the session here; protected loaders read it.
export const sessionContext = createContext<Session>();

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Protected branch: no session → /login, remembering where the user was going.
export const requireAuth: MiddlewareFunction = async ({ request, context }) => {
  const session = await getSession();
  if (!session) {
    const { pathname, search } = new URL(request.url);
    throw redirect(`/login?from=${encodeURIComponent(pathname + search)}`);
  }
  context.set(sessionContext, session);
};

// Public-only branch: already signed in → skip the login page.
export const requireGuest: MiddlewareFunction = async () => {
  if (await getSession()) throw redirect("/");
};

// Only allow same-site paths, so ?from=https://evil.com can't redirect off-site.
export function safeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}