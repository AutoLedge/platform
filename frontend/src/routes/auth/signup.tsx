import { Form, Link, redirect, useActionData, useNavigation, useSearchParams, type ActionFunctionArgs } from 'react-router'
import AuthFrame from '@/components/AuthFrame'
import { safeRedirect } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'
import { supabase, SUPABASE_CONFIG_MESSAGE } from '@/lib/supabase'

export async function signupAction({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  if (!supabase) return { error: SUPABASE_CONFIG_MESSAGE, checkEmail: false }

  const firstName = String(form.get('firstName') ?? '').trim()
  const lastName = String(form.get('lastName') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  if (!firstName || !lastName || !email || password.length < 12 || form.get('terms') !== 'on') {
    return { error: 'Complete all fields, use a password with at least 12 characters, and accept the terms.', checkEmail: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  })
  if (error) return { error: error.message, checkEmail: false }

  if (data.session) {
    queryClient.clear()
    throw redirect(safeRedirect(form.get('from')))
  }

  return { error: null, checkEmail: true }
}

export default function Signup() {
  const actionData = useActionData<typeof signupAction>()
  const navigation = useNavigation()
  const [searchParams] = useSearchParams()

  if (actionData?.checkEmail) {
    return (
      <AuthFrame variant="signup">
        <div className="auth-heading">
          <h1>Check your email</h1>
          <p>We sent a confirmation link to finish creating your account.</p>
        </div>
        <div className="auth-switch auth-completion-link"><Link to="/login">Return to sign in</Link></div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame variant="signup">
      <div className="auth-heading">
        <h1>Create your account</h1>
        <p>You’ll set up or join a business next.</p>
      </div>
      <Form method="post" className="auth-form">
        <input type="hidden" name="from" value={searchParams.get('from') ?? '/'} />
        <div className="signup-name-grid">
          <div className="auth-field"><label htmlFor="signup-first-name">First name</label><input id="signup-first-name" name="firstName" autoComplete="given-name" required /></div>
          <div className="auth-field"><label htmlFor="signup-last-name">Last name</label><input id="signup-last-name" name="lastName" autoComplete="family-name" required /></div>
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">Work email</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@business.com" aria-describedby="signup-email-hint" required />
          <span className="auth-field-hint" id="signup-email-hint">Use the address your business invitations are sent to.</span>
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={12} aria-describedby="password-rules" required />
          <span className="auth-field-hint" id="password-rules">Use at least 12 characters.</span>
        </div>
        <label className="terms-option" htmlFor="signup-terms">
          <input id="signup-terms" name="terms" type="checkbox" required />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {actionData?.error && <p className="auth-error" role="alert">{actionData.error}</p>}
        <button className="auth-submit" type="submit" disabled={!supabase || navigation.state === 'submitting'}>
          {navigation.state === 'submitting' ? 'Creating account…' : 'Create account'}
        </button>
      </Form>
      {!supabase && <p className="auth-config-notice" role="status">{SUPABASE_CONFIG_MESSAGE}</p>}
      <div className="auth-switch"><span>Already have an account?</span> <Link to="/login">Sign in</Link></div>
    </AuthFrame>
  )
}
