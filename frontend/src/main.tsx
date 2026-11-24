import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { LucideProvider } from "lucide-react";
import { router } from "@/router";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { initTheme } from "@/lib/theme";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@/styles/index.css";
import "@/styles/App.css";

initTheme();

// Runs whenever the session ends: logout, a 401 from FastAPI, or sign-out in another tab.
supabase?.auth.onAuthStateChange((event) => {
  if (event !== "SIGNED_OUT") return;
  queryClient.clear(); // don't leave one user's financial data in memory for the next
  if (router.state.location.pathname !== "/login") void router.navigate("/login");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* SPEC.md → Foundations: lucide icons always at strokeWidth 1.5 */}
      <LucideProvider strokeWidth={1.5}>
        <RouterProvider router={router} />
      </LucideProvider>
    </QueryClientProvider>
  </StrictMode>,
);
