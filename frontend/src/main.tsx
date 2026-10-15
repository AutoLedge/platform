import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/router";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import "@/index.css";
import "@/App.css";

// Runs whenever the session ends: logout, a 401 from FastAPI, or sign-out in another tab.
supabase?.auth.onAuthStateChange((event) => {
  if (event !== "SIGNED_OUT") return;
  queryClient.clear(); // don't leave one user's financial data in memory for the next
  if (router.state.location.pathname !== "/login") void router.navigate("/login");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
