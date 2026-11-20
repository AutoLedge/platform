import { createBrowserRouter } from "react-router";
import { requireAuth, requireGuest } from "./lib/auth";
import ErrorPage from "@/routes/error-page";
import Login, { loginAction } from "@/routes/login";
import Signup, { signupAction } from "@/routes/signup";
import { logoutAction } from "@/routes/logout";
import DashboardLayout from "@/routes/dashboard-layout";
import { dashboardLoader, type RouteHandle } from "@/routes/dashboard-loaders";
import Home from "@/routes/home";
import { businessLoader, homeLoader } from "@/routes/business-loaders";
import OnboardingBusiness from "@/routes/onboarding-business";
import OnboardingAccounts from "@/routes/onboarding-accounts";
import OnboardingReview from "@/routes/onboarding-review";
import { finishSetupAction, requireDraftLoader } from "@/routes/onboarding-loaders";
import Overview from "@/routes/overview";
import Reconciliation from "@/routes/reconciliation";
import Transactions from "@/routes/transactions";
import { transactionsLoader } from "@/routes/transactions-loaders";
import Invoices from "@/routes/invoices";
import Connections from "@/routes/connections";
import { connectionsAction, connectionsLoader } from "@/routes/connections-loaders";
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

      // ── Development only: styled shadcn components with sample content. Stripped from production builds. ──
      ...(import.meta.env.DEV
        ? [{ path: "/dev/components", lazy: async () => ({ Component: (await import("@/routes/dev-components")).default }) }]
        : []),

      // ── Protected ──
      {
        middleware: [requireAuth],
        Component: DashboardLayout,
        loader: dashboardLoader,
        children: [
          // `/` decides where the user goes: their business, a picker, or the choose page.
          { index: true, Component: Home, loader: homeLoader, handle: { title: "Businesses" } satisfies RouteHandle },

          // Business onboarding. Reachable with or without a business (it's how a second one is made).
          { path: "onboarding/business", Component: OnboardingBusiness, handle: { title: "New business" } satisfies RouteHandle },
          { path: "onboarding/accounts", Component: OnboardingAccounts, loader: requireDraftLoader, handle: { title: "New business" } satisfies RouteHandle },
          { path: "onboarding/review", Component: OnboardingReview, loader: requireDraftLoader, action: finishSetupAction, handle: { title: "New business" } satisfies RouteHandle },

          // Every business page carries its business in the URL. No top-level aliases.
          {
            path: "b/:businessId",
            loader: businessLoader, // 404 → ErrorPage "Not found"
            children: [
              { index: true, Component: Overview, handle: { title: "Overview" } satisfies RouteHandle },
              { path: "reconciliation", Component: Reconciliation, handle: { title: "Reconciliation" } satisfies RouteHandle },
              { path: "transactions", Component: Transactions, loader: transactionsLoader, handle: { title: "Transactions" } satisfies RouteHandle },
              { path: "invoices", Component: Invoices, handle: { title: "Invoices" } satisfies RouteHandle },
              { path: "connections", Component: Connections, loader: connectionsLoader, action: connectionsAction, handle: { title: "Connections" } satisfies RouteHandle },
              { path: "settings", Component: Settings, handle: { title: "Settings" } satisfies RouteHandle },
            ],
          },
        ],
      },
    ],
  },
]);
