// The lazily loaded route modules, in one place: the router loads each on demand, and the shell
// preloads them all when the browser is idle, so the code is never what a navigation waits for.
export const pageModules = {
  dashboardLayout: () => import("@/routes/shell/dashboard-layout"),
  home: () => import("@/routes/home/home"),
  onboardingBusiness: () => import("@/routes/onboarding/onboarding-business"),
  onboardingAccounts: () => import("@/routes/onboarding/onboarding-accounts"),
  onboardingReview: () => import("@/routes/onboarding/onboarding-review"),
  overview: () => import("@/routes/overview/overview"),
  reconciliation: () => import("@/routes/reconciliation/reconciliation"),
  transactions: () => import("@/routes/transactions/transactions"),
  invoices: () => import("@/routes/invoices/invoices"),
  connections: () => import("@/routes/connections/connections"),
  settings: () => import("@/routes/settings/settings"),
};

/** Fetch every page chunk once the browser is idle (after the shell has rendered). */
export function preloadPagesWhenIdle() {
  const run = () => {
    for (const load of Object.values(pageModules)) load().catch(() => {}); // a failure retries on navigation
  };
  // Safari has no requestIdleCallback: fall back to a short timeout.
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1500);
  return () => clearTimeout(id);
}
