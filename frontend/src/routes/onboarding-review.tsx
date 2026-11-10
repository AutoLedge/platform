import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { OnboardingAside, OnboardingPage } from '@/components/Onboarding'
import type { finishSetupAction, requireDraftLoader } from '@/routes/onboarding-loaders'

// Figma: AutoLedge / Onboarding · Review & finish (62:242).
// Finish setup is the only onboarding step that calls the API (POST /businesses).

export default function OnboardingReview() {
  const { draft } = useLoaderData<typeof requireDraftLoader>()
  const actionData = useActionData<typeof finishSetupAction>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle' && navigation.formMethod?.toLowerCase() === 'post'

  return (
    <OnboardingPage
      step={3}
      title="Review & finish"
      subtitle="One last look before your workspace is ready."
      time="Almost there"
      aside={
        <OnboardingAside
          badge="Ready to launch"
          title="Your next chapter starts here"
          intro="Here’s what happens after setup."
          numbered="plain"
          items={[
            { title: 'Your data starts syncing', text: 'We’ll import the last 90 days of activity.' },
            { title: 'See your business clearly', text: 'Explore cash flow, bills and invoices.' },
            { title: 'Make it your own', text: 'Invite your team from Settings.' },
          ]}
          note={{ title: 'Nothing is set in stone', text: 'Update your business details and manage connections anytime in Settings.' }}
          support="Questions before you get started?"
        />
      }
    >
      <Form method="post" className="onboarding-card onboarding-form">
        <h2>Everything in one place</h2>
        <p className="onboarding-card-intro">Review your details, then finish setting up AutoLedge.</p>
        <hr className="onboarding-divider" />

        <div className="review-section-heading">
          <h3>Business details</h3>
          <Link className="review-link" to="/onboarding/business">Edit details</Link>
        </div>
        <dl className="review-details">
          <dt>Business name</dt>
          <dd>{draft.name}</dd>
        </dl>
        <input type="hidden" name="name" value={draft.name} />
        <hr className="onboarding-divider" />

        <div className="review-section-heading">
          <h3>Connected accounts</h3>
        </div>
        <p className="onboarding-hint">None yet: connect your bank later in Connections.</p>

        {actionData?.error && <p className="onboarding-error" role="alert">{actionData.error}</p>}
        <hr className="onboarding-divider" />
        <div className="onboarding-actions">
          <Link className="onboarding-button is-secondary" to="/onboarding/accounts">← Back</Link>
          <Link className="onboarding-button is-text" to="/">Save and exit</Link>
          <button className="onboarding-button is-primary onboarding-actions-end" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up…' : 'Finish setup →'}
          </button>
        </div>
      </Form>
    </OnboardingPage>
  )
}
