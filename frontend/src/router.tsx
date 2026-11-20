import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { requireAuth, requireGuest } from "./lib/auth";
import ErrorPage from "@/routes/error-page";
import Login, { loginAction } from "@/routes/login";
import Signup, { signupAction } from "@/routes/signup";
import { logoutAction } from "@/routes/logout";
import { dashboardLoader, type RouteHandle } from "@/routes/dashboard-loaders";
import { businessLoader, homeLoader } from "@/routes/business-loaders";
import { finishSetupAction, requireDraftLoader } from "@/routes/onboarding-loaders";
import { transactionsLoader } from "@/routes/transactions-loaders";
import { connectionsAction, connectionsLoader } from "@/routes/connections-loaders";
import { pageModules } from "@/routes/page-modules";

/**
 * Code-splitting: the shell and every page component load on demand, so the sign-in pages don't
 * download the app and each page brings its own libraries (e.g. the calendar on Transactions).
 * Loaders and actions stay in this bundle, so React Router fetches a page's code and its data
 * in parallel; the shell also preloads every page chunk when idle (page-modules.ts).
 */
const lazyComponent = (load: () => Promise<{ default: ComponentType }>) => ({
  Component: async () => (await load()).default,
});

export const router = createBrowserRouter([
  {
    HydrateFallback: () => <p>Loading…</p>,
    ErrorBoundary: ErrorPage, // catches errors from every route below, plus unknown URLs
    children: [
      // ── Unprotected: only for signed-out users (in the main bundle: they're the entry pages) ──
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
        ? [{ path: "/dev/components", lazy: lazyComponent(() => import("@/routes/dev-components")) }]
        : []),

      // ── Protected ──
      {
        middleware: [requireAuth],
        lazy: lazyComponent(pageModules.dashboardLayout),
        loader: dashboardLoader,
        children: [
          // `/` decides where the user goes: their business, a picker, or the choose page.
          { index: true, lazy: lazyComponent(pageModules.home), loader: homeLoader, handle: { title: "Businesses" } satisfies RouteHandle },

          // Business onboarding. Reachable with or without a business (it's how a second one is made).
          { path: "onboarding/business", lazy: lazyComponent(pageModules.onboardingBusiness), handle: { title: "New business" } satisfies RouteHandle },
          { path: "onboarding/accounts", lazy: lazyComponent(pageModules.onboardingAccounts), loader: requireDraftLoader, handle: { title: "New business" } satisfies RouteHandle },
          { path: "onboarding/review", lazy: lazyComponent(pageModules.onboardingReview), loader: requireDraftLoader, action: finishSetupAction, handle: { title: "New business" } satisfies RouteHandle },

          // Every business page carries its business in the URL. No top-level aliases.
          {
            path: "b/:businessId",
            loader: businessLoader, // 404 → ErrorPage "Not found"
            children: [
              { index: true, lazy: lazyComponent(pageModules.overview), handle: { title: "Overview" } satisfies RouteHandle },
              { path: "reconciliation", lazy: lazyComponent(pageModules.reconciliation), handle: { title: "Reconciliation" } satisfies RouteHandle },
              { path: "transactions", lazy: lazyComponent(pageModules.transactions), loader: transactionsLoader, handle: { title: "Transactions" } satisfies RouteHandle },
              { path: "invoices", lazy: lazyComponent(pageModules.invoices), handle: { title: "Invoices" } satisfies RouteHandle },
              { path: "connections", lazy: lazyComponent(pageModules.connections), loader: connectionsLoader, action: connectionsAction, handle: { title: "Connections" } satisfies RouteHandle },
              { path: "settings", lazy: lazyComponent(pageModules.settings), handle: { title: "Settings" } satisfies RouteHandle },
            ],
          },
        ],
      },
    ],
  },
]);
