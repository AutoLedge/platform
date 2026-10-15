// src/routes/signup.tsx
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
} from "react-router";
import { supabase } from "@/lib/supabase";

export async function signupAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
    options: {
      // Where the confirmation email's link sends the user
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) return { error: error.message, checkEmail: false };

  // Email confirmation off: signed in immediately
  if (data.session) throw redirect("/");

  // Email confirmation on (Supabase's default): no session until they click the link
  return { error: null, checkEmail: true };
}

export default function Signup() {
  const actionData = useActionData<typeof signupAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  if (actionData?.checkEmail) {
    return <p>Check your email for a confirmation link to finish signing up.</p>;
  }

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
        One login. Every business you're part of.
      </p>
      <p className="max-w-xl text-sm leading-normal text-on-navy-muted">
        Create a business as its Owner, or join one you've been invited to.
      </p>
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

      <div className="flex max-w-[460px] flex-col gap-7">
        <h2 className="font-serif text-[40px] leading-[1.15] font-medium text-balance text-white xl:text-[42px]">
          One login. Every business you're part of.
        </h2>
        <p className="text-base leading-relaxed text-on-navy-muted">
          Your account belongs to you. Businesses belong to their owners. Create a business and
          you're its Owner, or join one you've been invited to as a Member.
        </p>

        {/* Membership example */}
        <div
          role="img"
          aria-label="Example: one account that owns Northfield Bakery and is a member of Harbor & Pine Design"
          className="flex flex-col gap-2.5 rounded-xl border border-navy-700 bg-navy-850 p-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-on-navy text-[13px] font-semibold text-navy-900">
              You
            </span>
            <span className="text-sm font-medium text-on-navy">Your Ledgerwell account</span>
          </div>
          <div className="ml-4 flex flex-col gap-2 border-l border-dashed border-navy-400 pl-4">
            <div className="flex items-center justify-between gap-3 rounded-md bg-navy-800 px-3 py-2.5">
              <span className="text-sm text-white">Northfield Bakery LLC</span>
              <span className="rounded-xs bg-green-150 px-2 py-0.5 text-xs font-semibold tracking-wide text-green-900 uppercase">
                Owner
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-navy-800 px-3 py-2.5">
              <span className="text-sm text-white">Harbor &amp; Pine Design</span>
              <span className="rounded-xs bg-navy-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-navy-900 uppercase">
                Member
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="Legal" className="flex flex-wrap gap-5 text-[13px] text-on-navy-muted">
        <span>© Ledgerwell</span>
        <a href="/privacy" className="text-on-navy-muted hover:text-white">Privacy</a>
        <a href="/security" className="text-on-navy-muted hover:text-white">Security</a>
      </nav>
    </aside>

    {/* Form column */}
    <main className="flex flex-1 justify-center px-5 pt-7 pb-10 sm:px-8 sm:pt-12 lg:items-center lg:px-6 lg:py-12">
      <div className="flex w-full max-w-[440px] flex-col gap-6 sm:gap-7">
        <Form method="post" className="flex flex-col gap-6 sm:gap-7">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <h1 className="font-serif text-[28px] leading-tight font-semibold sm:text-[34px]">Create your account</h1>
            <p className="text-[15px] leading-normal text-foreground-secondary">
              You'll set up or join a business next.
            </p>
          </div>

          <input type="hidden" name="from" value={searchParams.get("from") ?? "/"} />

          <div className="flex flex-col gap-4 sm:gap-[18px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-[13px] font-semibold text-ink-secondary">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-[13px] font-semibold text-ink-secondary">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-semibold text-ink-secondary">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-describedby="email-hint"
                required
                className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
              />
              <span id="email-hint" className="text-[13px] leading-normal text-foreground-secondary">
                Use the address your business invitations are sent to.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold text-ink-secondary">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                aria-describedby="password-rules"
                required
                className="h-12 w-full min-w-0 rounded-md border border-line-input bg-background-primary px-3.5 text-base text-foreground-primary placeholder:text-placeholder focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus lg:h-[46px] lg:text-[15px]"
              />
              <ul id="password-rules" className="mt-1 flex flex-col gap-1.5 text-[13px] text-foreground-secondary">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                  At least 12 characters
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                  Includes a number or symbol
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                  Upper- and lowercase letters
                </li>
              </ul>
            </div>

            <label htmlFor="terms" className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-ink-secondary">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-px size-5 shrink-0 cursor-pointer accent-navy-600 lg:size-[18px]"
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noreferrer" className="text-action hover:text-action-hover">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-action hover:text-action-hover">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
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
            {navigation.state === "submitting" ? "Creating account…" : "Create account"}
          </button>
        </Form>

        <p className="text-center text-sm text-foreground-secondary">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-action hover:text-action-hover">
            Sign in
          </a>
        </p>
      </div>
    </main>
  </div>
);
}