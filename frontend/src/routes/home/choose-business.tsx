import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { OnboardingFooter, OnboardingNote } from '@/components/Onboarding'

// Figma: AutoLedge / Overview · No business membership (65:16). Rendered by Home when the user has no business.

const createSteps = ['Add your business details', 'Connect your financial accounts', 'Review and finish setup']

export default function ChooseBusiness() {
  const [joinNote, setJoinNote] = useState(false)

  // Invitations don't exist yet: say so, and make no API call.
  const onJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinNote(true)
  }

  return (
    <main className="page-content onboarding-page">
      <div className="onboarding-heading">
        <div>
          <h1>Overview</h1>
          <p className="onboarding-subtitle">Welcome to AutoLedge. Your business journey starts here.</p>
        </div>
      </div>

      <div className="choose-intro">
        <h2>You’re not a member of a business yet</h2>
        <p>Create your own workspace or join an existing business to see your overview.</p>
      </div>

      <div className="choose-options">
        <section className="onboarding-card choose-option" aria-labelledby="create-business-title">
          <p className="choose-eyebrow">START SOMETHING NEW</p>
          <h3 id="create-business-title">Create a business</h3>
          <p className="choose-description">Set up a workspace for your business and bring your finances into one place.</p>
          <hr className="onboarding-divider" />
          <ol className="choose-steps">
            {createSteps.map((step, index) => (
              <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{step}</li>
            ))}
          </ol>
          <p className="choose-meta">About 5 minutes · You’ll manage the business</p>
          {/* Keeps any existing draft, so the user resumes where they left off. */}
          <Link className="onboarding-button is-primary is-wide" to="/onboarding/business">Create a business →</Link>
        </section>

        <section className="onboarding-card choose-option" aria-labelledby="join-business-title">
          <p className="choose-eyebrow">WORK WITH YOUR TEAM</p>
          <h3 id="join-business-title">Join a business</h3>
          <p className="choose-description">Already part of a team? Use an invitation from your business administrator to get access.</p>
          <hr className="onboarding-divider" />
          <form className="choose-join" onSubmit={onJoin}>
            <label className="onboarding-label" htmlFor="invitation">Invitation link or code</label>
            <input
              id="invitation"
              name="invitation"
              className="onboarding-input"
              placeholder="Paste your invitation link or code"
              autoComplete="off"
              aria-describedby={joinNote ? 'join-note' : undefined}
            />
            <p className="onboarding-label choose-join-help">Don’t have an invitation?</p>
            <p className="choose-description is-small">Ask your business administrator to send you one.</p>
            {joinNote && (
              <p className="onboarding-inline-note" id="join-note" role="status">Joining with an invitation isn’t available yet.</p>
            )}
            <button className="onboarding-button is-secondary is-wide" type="submit">Join a business</button>
          </form>
        </section>
      </div>

      <OnboardingNote
        title="Your overview appears once you belong to a business."
        text="Joining uses your team’s existing workspace. Creating starts the three-step business onboarding."
      />

      <OnboardingFooter
        left="AutoLedge · Overview"
        right={<span className="onboarding-footer-strong">Need help? Contact support</span>}
      />
    </main>
  )
}
