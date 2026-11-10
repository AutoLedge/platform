import type { ReactNode } from 'react'
import '@/styles/onboarding.css'

// Shared pieces of the business onboarding — Figma: AutoLedge / 62:16, 62:130, 62:242.

const steps = ['Business details', 'Connect accounts', 'Review & finish'] as const

/** The 3-step indicator. `current` is 1-based. */
export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="onboarding-steps" aria-label="Setup progress">
      {steps.map((label, index) => {
        const step = index + 1
        const state = step < current ? 'completed' : step === current ? 'current' : 'upcoming'
        return (
          <li key={label} className={`onboarding-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="onboarding-step-marker" aria-hidden="true">{state === 'completed' ? '✓' : step}</span>
            <span className="onboarding-step-text">
              <span className="onboarding-step-label">{label}</span>
              <span className="onboarding-step-status">
                {state === 'completed' ? 'Completed' : state === 'current' ? 'In progress' : 'Up next'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Page heading with the time chip, the step indicator, the two-column body and the footer. */
export function OnboardingPage({
  step,
  title,
  subtitle,
  time,
  aside,
  children,
}: {
  step: 1 | 2 | 3
  title: string
  subtitle: string
  time: string
  aside: ReactNode
  children: ReactNode
}) {
  return (
    <main className="page-content onboarding-page">
      <div className="onboarding-heading">
        <div>
          <h1>{title}</h1>
          <p className="onboarding-subtitle">{subtitle}</p>
        </div>
        <p className="onboarding-chip">{time}</p>
      </div>
      <OnboardingSteps current={step} />
      <div className="onboarding-grid">
        <div className="onboarding-main">{children}</div>
        <div className="onboarding-side">{aside}</div>
      </div>
      <OnboardingFooter left="AutoLedge · Business setup" right={`Step ${step} of 3`} />
    </main>
  )
}

export function OnboardingFooter({ left, right }: { left: string; right: ReactNode }) {
  return (
    <footer className="onboarding-footer">
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  )
}

type GuideItem = { title: string; text: string }

/** The right-hand info card, the note below it and the support line. Static copy from the frames. */
export function OnboardingAside({
  badge,
  title,
  intro,
  items,
  numbered = 'boxed',
  note,
  support,
}: {
  badge?: string
  title: string
  intro: string
  items: GuideItem[]
  numbered?: 'boxed' | 'plain'
  note: { title: string; text: string }
  support: string
}) {
  return (
    <>
      <section className="onboarding-card onboarding-guide">
        {badge && <p className="onboarding-badge">✓ {badge}</p>}
        <h2>{title}</h2>
        <p className="onboarding-card-intro">{intro}</p>
        <ol className={`onboarding-guide-list is-${numbered}`}>
          {items.map((item, index) => (
            <li key={item.title}>
              <span className="onboarding-guide-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <OnboardingNote title={note.title} text={note.text} />
      <div className="onboarding-support">
        <p>{support}</p>
        {/* No support page or address yet: text only, not a link. */}
        <p className="onboarding-support-contact">Contact support</p>
      </div>
    </>
  )
}

export function OnboardingNote({ title, text }: { title: string; text: string }) {
  return (
    <aside className="onboarding-note">
      <p className="onboarding-note-title">{title}</p>
      <p>{text}</p>
    </aside>
  )
}
