import { createBrowserRouter } from "react-router";
import { requireAuth, requireGuest } from "./lib/auth";
import ErrorPage from "@/routes/error-page";
import Login, { loginAction } from "@/routes/login";
import Signup, { signupAction } from "@/routes/signup";
import { logoutAction } from "@/routes/logout";
import Dashboard, { dashboardLoader } from "@/routes/dashboard";

export const router = createBrowserRouter([
  {
    HydrateFallback: () => <p>Loading…</p>,
    ErrorBoundary: ErrorPage, // catches errors from every route below, plus unknown URLs
    children: [
      // ── Unprotected: only for signed-out users ──
      {
        middleware: [requireGuest],
        children: [
          { path: "/login", Component: Login, action: loginAction },
          { path: "/signup", Component: Signup, action: signupAction }
        ],
      },

      // ── Always reachable ──
      { path: "/logout", action: logoutAction },

      // ── Protected ──
      {
        middleware: [requireAuth],
        children: [{ index: true, Component: Dashboard, loader: dashboardLoader }],
      },
    ],
  },
]);