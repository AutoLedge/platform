import type { ReactNode } from 'react'
import { Link } from 'react-router'

type AuthFrameProps = {
  children: ReactNode
  variant?: 'login' | 'signup'
}

export default function AuthFrame({ children, variant = 'login' }: AuthFrameProps) {
  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <Link className="auth-brand" to="/login" aria-label="AutoLedge sign in">
          <span className="brand-mark" aria-hidden="true" />
          <span>AutoLedge</span>
        </Link>
      </header>
      <div className="auth-main">
        <section className={`auth-card${variant === 'signup' ? ' signup-card' : ''}`}>
          {children}
        </section>
      </div>
    </main>
  )
}
