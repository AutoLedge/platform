import {
  Form,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
} from "react-router";
import { supabase } from "@/lib/supabase";
import { safeRedirect } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

export async function loginAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: error.message };
  queryClient.clear(); // start each session with an empty cache
  throw redirect(safeRedirect(form.get("from")));
}

export default function Login() {
  const actionData = useActionData<typeof loginAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  return (
    <div className="flex min-h-dvh flex-col bg-background-secondary font-sans text-foreground-primary lg:flex-row">
      {/* Compact header: phones and tablets */}
      <header className="flex flex-col gap-3 bg-navy-900 px-5 pt-5 pb-6 text-on-navy sm:px-8 sm:pt-7 sm:pb-8 lg:hidden">
        <span className="inline-flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="7" className="fill-white" />
            <path d="M8 10h12M8 14h8M8 18h5" strokeWidth="2" strokeLinecap="round" className="stroke-navy-900" />
            <path d="M16 18.5l2 2 4-4.5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="stroke-green-700" />
          </svg>
          <span className="font-serif text-xl font-semibold text-white">Ledgerwell</span>
        </span>
        <p className="max-w-xl font-serif text-[22px] leading-tight font-medium text-balance text-white sm:text-[28px]">
          Your business finances, accounted for to the cent.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-on-navy-muted sm:text-[13px]">
          <li className="flex items-center gap-1.5">
            <svg className="size-3.5 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 10V7a6 6 0 0 1 12 0v3" />
              <rect x="4" y="10" width="16" height="11" rx="2" />
            </svg>
            Encrypted
          </li>
          <li className="flex items-center gap-1.5">
            <svg className="size-3.5 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            </svg>
            Read-only bank access
          </li>
          <li className="flex items-center gap-1.5">
            <svg className="size-3.5 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
              <path d="M8.5 12l2.5 2.5 4.5-5" />
            </svg>
            Role-based access
          </li>
        </ul>
      </header>

      {/* Brand panel: desktop */}
      <aside className="hidden flex-col justify-between gap-12 bg-navy-900 px-14 py-12 text-on-navy lg:flex lg:w-[44%] lg:max-w-[640px] lg:shrink-0">
        <span className="inline-flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="7" className="fill-white" />
            <path d="M8 10h12M8 14h8M8 18h5" strokeWidth="2" strokeLinecap="round" className="stroke-navy-900" />
            <path d="M16 18.5l2 2 4-4.5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="stroke-green-700" />
          </svg>
          <span className="font-serif text-[22px] font-semibold text-white">Ledgerwell</span>
        </span>

        <div className="flex max-w-[460px] flex-col gap-8">
          <h2 className="font-serif text-[40px] leading-[1.15] font-medium text-balance text-white xl:text-[42px]">
            Your business finances, accounted for to the cent.
          </h2>
          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-800 text-green-300">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 10V7a6 6 0 0 1 12 0v3" />
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                </svg>
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[15px] font-semibold text-white">Encrypted end to end</strong>
                <span className="text-sm leading-normal text-on-navy-muted">Data is encrypted in transit and at rest.</span>
              </span>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-800 text-green-300">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                </svg>
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[15px] font-semibold text-white">Read-only bank connections</strong>
                <span className="text-sm leading-normal text-on-navy-muted">We can see transactions. We can never move money.</span>
              </span>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-800 text-green-300">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
                  <path d="M8.5 12l2.5 2.5 4.5-5" />
                </svg>
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[15px] font-semibold text-white">Access by role, set by the owner</strong>
                <span className="text-sm leading-normal text-on-navy-muted">Every member sees only what their role allows.</span>
              </span>
            </li>
          </ul>
        </div>

        <nav aria-label="Legal" className="flex flex-wrap gap-5 text-[13px] text-on-navy-muted">
          <span>© Ledgerwell</span>
          <a href="/privacy" className="text-on-navy-muted hover:text-white">Privacy</a>
          <a href="/security" className="text-on-navy-muted hover:text-white">Security</a>
        </nav>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 justify-center px-5 pt-7 pb-10 sm:px-8 sm:pt-12 lg:items-center lg:px-6 lg:py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-6 sm:gap-7">
          <Form method="post" className="flex flex-col gap-6 sm:gap-7">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <h1 className="font-serif text-[28px] leading-tight font-semibold sm:text-[34px]">Sign in</h1>
              <p className="text-[15px] leading-normal text-foreground-secondary">
                Welcome back. Sign in to reach your business workspaces.
              </p>
            </div>

            <input type="hidden" name="from" value={searchParams.get("from") ?? "/"} />

            <div className="flex flex-col gap-4 sm:gap-[18px]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-ink-secondary">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="password" className="text-[13px] font-semibold text-ink-secondary">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-[13px] font-medium text-action hover:text-action-hover">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
                />
              </div>
            </div>

            {actionData?.error && (
              <p
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-rust-200 bg-rust-50 px-4 py-3 text-sm leading-normal text-rust-900"
              >
                <svg className="mt-px size-[18px] shrink-0 text-rust-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5v5.5M12 16.5v.01" />
                </svg>
                <span>{actionData.error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={navigation.state === "submitting"}
              className="flex h-[50px] w-full cursor-pointer items-center justify-center rounded-md bg-action text-base font-semibold text-white hover:bg-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-80 lg:h-12 lg:text-[15px]"
            >
              {navigation.state === "submitting" ? "Signing in…" : "Sign in"}
            </button>
          </Form>

          <p className="text-center text-sm text-foreground-secondary">
            New to Ledgerwell?{" "}
            <a href="/signup" className="font-semibold text-action hover:text-action-hover">
              Create an account
            </a>
          </p>

          <p className="flex items-start gap-2.5 rounded-md bg-navy-50 px-4 py-3 text-[13px] leading-normal text-ink-secondary">
            <svg className="mt-px size-[18px] shrink-0 text-navy-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
              <path d="M8.5 12l2.5 2.5 4.5-5" />
            </svg>
            <span>We'll never ask for your password or a sign-in code by email, text, or phone.</span>
          </p>
        </div>
      </main>
    </div>
  );
}