import { createBrowserRouter } from "react-router";
import { requireAuth, requireGuest } from "./lib/auth";
import ErrorPage from "@/routes/error-page";
import Login, { loginAction } from "@/routes/login";
import Signup, { signupAction } from "@/routes/signup";
import { logoutAction } from "@/routes/logout";
import DashboardLayout, { dashboardLoader } from "@/routes/dashboard-layout";
import Home from "@/routes/home";
import { businessLoader, homeLoader } from "@/routes/business-loaders";
import Overview from "@/routes/overview";
import Reconciliation from "@/routes/reconciliation";
import Transactions from "@/routes/transactions";
import Invoices from "@/routes/invoices";
import Connections from "@/routes/connections";
import Settings from "@/routes/settings";

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
        Component: DashboardLayout,
        loader: dashboardLoader,
        children: [
          // `/` decides where the user goes: their business, a picker, or the choose page.
          { index: true, Component: Home, loader: homeLoader },

          // Every business page carries its business in the URL. No top-level aliases.
          {
            path: "b/:businessId",
            loader: businessLoader, // 404 → ErrorPage "Not found"
            children: [
              { index: true, Component: Overview },
              { path: "reconciliation", Component: Reconciliation },
              { path: "transactions", Component: Transactions },
              { path: "invoices", Component: Invoices },
              { path: "connections", Component: Connections },
              { path: "settings", Component: Settings },
            ],
          },
        ],
      },
    ],
  },
]);
