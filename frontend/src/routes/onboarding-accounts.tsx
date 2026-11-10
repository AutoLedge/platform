import { Link } from 'react-router'
import { OnboardingAside, OnboardingPage } from '@/components/Onboarding'

// Figma: AutoLedge / Onboarding · Connect accounts (62:130).
// Bank connections arrive with Plaid (N14), so this step is an empty state for now.
// The design's "Accounting software" block and "Import transactions from" select are omitted.

export default function OnboardingAccounts() {
  return (
    <OnboardingPage
      step={2}
      title="Connect your accounts"
      subtitle="Bring your bank and accounting data together in one place."
      time="About 3 minutes"
      aside={
        <OnboardingAside
          title="A connected workspace"
          intro="Less manual work. More clarity."
          items={[
            { title: 'Stay up to date', text: 'Bring your bank activity into one place.' },
            { title: 'Keep your books aligned', text: 'Match transactions with invoices and bills.' },
            { title: 'Start with recent activity', text: 'Import the last 90 days to get started.' },
          ]}
          note={{ title: 'You’re in control', text: 'Review permissions before connecting. Manage access anytime in Connections.' }}
          support="Need help connecting an account?"
        />
      }
    >
      <section className="onboarding-card onboarding-form">
        <h2>Your connected accounts</h2>
        <p className="onboarding-card-intro">Keep your books and bank activity in sync.</p>
        <hr className="onboarding-divider" />
        <h3 className="onboarding-label">Bank accounts</h3>
        <div className="onboarding-empty">
          <p>No accounts connected yet. You can connect your bank later in Connections.</p>
        </div>
        <div className="onboarding-connect">
          <button className="onboarding-button is-text" type="button" disabled aria-describedby="connect-soon">+ Connect an account</button>
          <span className="onboarding-soon" id="connect-soon">Available soon</span>
        </div>
        <hr className="onboarding-divider" />
        <div className="onboarding-actions">
          <Link className="onboarding-button is-secondary" to="/onboarding/business">← Back</Link>
          <Link className="onboarding-button is-text" to="/">Save and exit</Link>
          <Link className="onboarding-button is-primary onboarding-actions-end" to="/onboarding/review">Continue →</Link>
        </div>
      </section>
    </OnboardingPage>
  )
}
