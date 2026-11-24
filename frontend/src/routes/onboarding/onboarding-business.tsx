import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { OnboardingAside, OnboardingPage } from '@/components/Onboarding'
import { readDraft, writeDraft } from '@/lib/onboarding-draft'

// Figma: AutoLedge / Business onboarding (62:16). Step 1 only saves a draft; no API call.

const MAX_NAME = 200

export default function OnboardingBusiness() {
  const navigate = useNavigate()
  const [name, setName] = useState(() => readDraft().name)
  const [error, setError] = useState<string | null>(null)

  const onContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a business name')
    if (trimmed.length > MAX_NAME) return setError(`Use ${MAX_NAME} characters or fewer`)
    writeDraft({ name: trimmed })
    navigate('/onboarding/accounts')
  }

  const onSaveAndExit = () => {
    writeDraft({ name: name.trim() })
    navigate('/')
  }

  return (
    <OnboardingPage
      step={1}
      title="Let’s set up your business"
      subtitle="Start with your business name. Connect your accounts next."
      time="About 5 minutes"
      aside={
        <OnboardingAside
          title="Your business, connected"
          intro="Bring your finances into one place."
          items={[
            { title: 'Add your business name', text: 'Make AutoLedge work for you.' },
            { title: 'Connect your accounts', text: 'Sync your bank and accounting tools.' },
            { title: 'Get a clear financial picture', text: 'Track cash flow and reconcile faster.' },
          ]}
          note={{ title: 'Your data stays yours', text: 'Your financial information is private and only accessible to your team.' }}
          support="Need a hand getting started?"
        />
      }
    >
      <form className="onboarding-card onboarding-form" onSubmit={onContinue} noValidate>
        <h2>What’s your business called?</h2>
        <p className="onboarding-card-intro">Start with a name for your business workspace.</p>
        <hr className="onboarding-divider" />
        <div className="onboarding-field">
          <label className="onboarding-label" htmlFor="business-name">Business name</label>
          <input
            id="business-name"
            name="name"
            className="onboarding-input"
            placeholder="Enter your business name"
            autoComplete="organization"
            required
            maxLength={MAX_NAME}
            value={name}
            onChange={(event) => { setName(event.target.value); setError(null) }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'business-name-error business-name-hint' : 'business-name-hint'}
          />
          {error && <p className="onboarding-error" id="business-name-error" role="alert">{error}</p>}
        </div>
        <p className="onboarding-hint" id="business-name-hint">You can change your business name later in Settings.</p>
        <hr className="onboarding-divider" />
        <div className="onboarding-actions">
          <button className="onboarding-button is-text" type="button" onClick={onSaveAndExit}>Save and exit</button>
          <button className="onboarding-button is-primary onboarding-actions-end" type="submit">Continue →</button>
        </div>
      </form>
    </OnboardingPage>
  )
}
