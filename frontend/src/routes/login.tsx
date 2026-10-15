import { Form, Link, redirect, useActionData, useNavigation, useSearchParams, type ActionFunctionArgs } from 'react-router'
import AuthFrame from '@/components/AuthFrame'
import { safeRedirect } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'
import { supabase, SUPABASE_CONFIG_MESSAGE } from '@/lib/supabase'

export async function loginAction({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  if (!supabase) return { error: SUPABASE_CONFIG_MESSAGE }

  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get('email')).trim(),
    password: String(form.get('password')),
  })
  if (error) return { error: error.message }

  queryClient.clear()
  throw redirect(safeRedirect(form.get('from')))
}

export default function Login() {
  const actionData = useActionData<typeof loginAction>()
  const navigation = useNavigation()
  const [searchParams] = useSearchParams()

  return (
    <AuthFrame>
      <div className="auth-heading">
        <h1>Welcome back</h1>
        <p>Sign in to your workspace</p>
      </div>
      <Form method="post" className="auth-form">
        <input type="hidden" name="from" value={searchParams.get('from') ?? '/'} />
        <div className="auth-field">
          <label htmlFor="login-email">Work email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@business.com" required />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
        </div>
        {actionData?.error && <p className="auth-error" role="alert">{actionData.error}</p>}
        <button className="auth-submit" type="submit" disabled={!supabase || navigation.state === 'submitting'}>
          {navigation.state === 'submitting' ? 'Signing in…' : 'Sign in'}
        </button>
      </Form>
      {!supabase && <p className="auth-config-notice" role="status">{SUPABASE_CONFIG_MESSAGE}</p>}
      <div className="auth-switch"><span>New to AutoLedge?</span> <Link to="/signup">Create account</Link></div>
    </AuthFrame>
  )
}
