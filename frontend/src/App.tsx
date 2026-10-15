import { useState } from 'react'
import '@/App.css'
import ProfilePopup from '@/components/ProfilePopup'

type Page = 'Overview' | 'Reconciliation' | 'Transactions' | 'Invoices' | 'Connections' | 'Settings'
type AuthMode = 'login' | 'signup'
type IconName = 'overview' | 'reconciliation' | 'transactions' | 'invoices' | 'connections' | 'settings' | 'bell' | 'arrow' | 'alert' | 'check' | 'calendar' | 'eye'

const primaryLinks: { label: Page; icon: IconName }[] = [
  { label: 'Overview', icon: 'overview' },
  { label: 'Reconciliation', icon: 'reconciliation' },
  { label: 'Transactions', icon: 'transactions' },
  { label: 'Invoices', icon: 'invoices' },
]

const secondaryLinks: { label: Page; icon: IconName }[] = [
  { label: 'Connections', icon: 'connections' },
  { label: 'Settings', icon: 'settings' },
]

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const paths: Record<IconName, React.ReactNode> = {
    overview: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    reconciliation: <><path d="M20 7h-7a4 4 0 0 0-4 4v2" /><path d="m16 3 4 4-4 4" /><path d="M4 17h7a4 4 0 0 0 4-4v-2" /><path d="m8 21-4-4 4-4" /></>,
    transactions: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    invoices: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></>,
    connections: <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M9.5 9.5 14.5 14.5M14 7h4a2 2 0 0 1 2 2v2M10 17H6a2 2 0 0 1-2-2v-2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4L7.7 15a8 8 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.8Z" transform="translate(0 -1) scale(.95)" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

const attentionItems = [
  { tone: 'danger', icon: 'alert' as const, text: '3 transactions couldn’t be reconciled' },
  { tone: 'warning', icon: 'alert' as const, text: 'Invoice #432 is 14 days overdue' },
  { tone: 'success', icon: 'check' as const, text: 'Bank reconciliation completed' },
]

const reconciliationRows = [
  { date: 'Oct 12, 2026', description: 'Northstar Office Supply', reference: 'INV-1048', amount: '$1,284.50', status: 'Matched' },
  { date: 'Oct 11, 2026', description: 'Client payment · Acme Studio', reference: 'PAY-2081', amount: '+$3,600.00', status: 'Matched' },
  { date: 'Oct 10, 2026', description: 'Cloud hosting subscription', reference: '—', amount: '$249.00', status: 'Needs review' },
  { date: 'Oct 09, 2026', description: 'Client payment · Jordan Lee', reference: '—', amount: '+$875.00', status: 'Unmatched' },
]

function Sidebar({ page, onNavigate, onSignOut }: { page: Page; onNavigate: (page: Page) => void; onSignOut: () => void }) {
  const renderLink = ({ label, icon }: { label: Page; icon: IconName }) => (
    <button key={label} className={`nav-link${page === label ? ' active' : ''}`} onClick={() => onNavigate(label)} aria-current={page === label ? 'page' : undefined}>
      <Icon name={icon} /><span>{label}</span>
    </button>
  )

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('Overview')} aria-label="AutoLedge home">
        <span className="brand-mark" aria-hidden="true" /><span>AutoLedge</span>
      </button>
      <nav className="navigation" aria-label="Main navigation">
        <div className="nav-group">{primaryLinks.map(renderLink)}</div>
        <div className="nav-divider" />
        <div className="nav-group">{secondaryLinks.map(renderLink)}</div>
      </nav>
      <ProfilePopup onPreferences={() => onNavigate('Settings')} onSignOut={onSignOut} />
    </aside>
  )
}

function Topbar() {
  return <header className="topbar"><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={21} /><span className="notification-dot" /></button></header>
}

function DateSelector({ label }: { label: string }) {
  return <button className="date-selector"><Icon name="calendar" size={16} /><span>{label}</span><span className="chevron" /></button>
}

function Overview() {
  return (
    <main className="page-content overview-page">
      <div className="page-heading overview-heading">
        <div><p className="eyebrow">MONDAY, OCTOBER 12, 2026</p><h1>Good morning, Ahmed</h1><p className="page-subtitle">Here’s what’s going on with your business...</p></div>
        <DateSelector label="Last 30 days" />
      </div>

      <section className="metric-grid" aria-label="Financial summary">
        <article className="metric-card"><p className="metric-label">Cash balance</p><p className="metric-value">$48,000</p><p className="metric-foot"><span className="positive">↗ 7.2%</span> vs last month</p></article>
        <article className="metric-card"><p className="metric-label">Accounts receivable</p><p className="metric-value">$12,000</p><p className="metric-foot"><span className="negative">8</span> Outstanding invoices</p></article>
        <article className="metric-card"><p className="metric-label">Accounts payable</p><p className="metric-value">$7,320</p><p className="metric-foot"><span className="negative">5</span> Accounts payable</p></article>
        <article className="metric-card"><p className="metric-label">Projected 30 day cash</p><p className="metric-value">$51,800</p><p className="metric-foot"><span className="positive">↗ 52%</span> expected</p></article>
      </section>

      <section className="overview-panels">
        <article className="panel cash-flow-panel">
          <div className="panel-heading"><div><h2>Cash flow</h2><p className="panel-caption">Balance over the last 30 days</p></div><button className="subtle-select">Monthly <span className="chevron" /></button></div>
          <div className="chart-wrap" role="img" aria-label="Cash flow trend rising over the last 30 days">
            <div className="chart-y-labels"><span>$60k</span><span>$45k</span><span>$30k</span><span>$15k</span><span>$0</span></div>
            <svg className="cash-chart" viewBox="0 0 600 230" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="cash-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".22" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
              <path className="chart-gridline" d="M0 18H600M0 66H600M0 114H600M0 162H600M0 210H600" />
              <path d="M0 190 L110 136 L220 141 L330 91 L440 102 L600 32 L600 210 L0 210Z" fill="url(#cash-area)" />
              <path className="chart-line" d="M0 190 L110 136 L220 141 L330 91 L440 102 L600 32" />
              <circle cx="600" cy="32" r="4" className="chart-point" />
            </svg>
          </div>
          <div className="chart-x-labels"><span>Sep 13</span><span>Sep 20</span><span>Sep 27</span><span>Oct 4</span><span>Oct 12</span></div>
        </article>
        <article className="panel attention-panel">
          <div className="panel-heading"><div><h2>Needs attention</h2><p className="panel-caption">A few things to review</p></div><button className="text-link">View all <Icon name="arrow" size={16} /></button></div>
          <ul className="attention-list">{attentionItems.map((item) => <li className={`attention-item ${item.tone}`} key={item.text}><Icon name={item.icon} size={20} /><span>{item.text}</span><Icon name="arrow" size={16} /></li>)}</ul>
        </article>
      </section>
      <p className="data-note">Dashboard figures are sample data for preview.</p>
    </main>
  )
}

function Reconciliation() {
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Matched', 'Needs review', 'Unmatched']
  const visibleRows = reconciliationRows.filter((row) => filter === 'All' || row.status === filter)

  return (
    <main className="page-content reconciliation-page">
      <div className="page-heading reconciliation-heading"><div><p className="eyebrow">FINANCIAL WORKSPACE</p><h1>Reconciliation</h1><p className="page-subtitle">Match your bank transactions with invoices, payments and records</p></div><DateSelector label="October 2026" /></div>
      <div className="reconciliation-layout">
        <section className="reconciliation-main">
          <div className="reconciliation-metrics">
            <article className="recon-metric"><span className="recon-number">42</span><span>Records matched</span></article>
            <article className="recon-metric"><span className="recon-number green">38</span><span>Matched automatically</span></article>
            <article className="recon-metric"><span className="recon-number yellow">2</span><span>Require review</span></article>
            <article className="recon-metric"><span className="recon-number red">2</span><span>Unmatched</span></article>
          </div>
          <div className="reconciliation-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter reconciliation records">{filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={`filter-tab${filter === item ? ' selected' : ''}`} onClick={() => setFilter(item)}>{item}<span>{item === 'All' ? '42' : item === 'Matched' ? '38' : '2'}</span></button>)}</div><button className="outline-button">Export</button></div>
          <div className="records-panel">
            <div className="records-panel-heading"><div><h2>October activity</h2><p>Review how transactions match with your records.</p></div><button className="icon-button search-button" aria-label="Search records"><span className="search-icon" /></button></div>
            <div className="table-scroll"><table className="records-table"><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={`${row.date}-${row.description}`}><td>{row.date}</td><td className="description-cell">{row.description}</td><td>{row.reference}</td><td className="amount-cell">{row.amount}</td><td><span className={`status-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td></tr>)}</tbody></table></div>
            {visibleRows.length === 0 && <p className="empty-state">No records in this category.</p>}
            <div className="table-footer"><span>Showing {visibleRows.length} of 42 records</span><div><button className="pagination-button" disabled>Previous</button><button className="pagination-button">Next</button></div></div>
          </div>
          <p className="data-note">Reconciliation records are sample data for preview.</p>
        </section>
        <aside className="discrepancy-card"><p className="discrepancy-label">Potential discrepancy</p><p className="discrepancy-value">$23,983</p><div className="discrepancy-divider" /><p className="discrepancy-label">Possible matches</p><div className="possible-match"><span className="match-icon"><Icon name="reconciliation" size={18} /></span><div><strong>4 records</strong><span>Could be matched</span></div><Icon name="arrow" size={16} /></div><button className="review-button">Review matches <Icon name="arrow" size={16} /></button></aside>
      </div>
    </main>
  )
}

function ComingSoon({ page }: { page: Page }) {
  return <main className="page-content coming-soon"><p className="eyebrow">FINANCIAL WORKSPACE</p><h1>{page}</h1><p className="page-subtitle">This section is coming soon.</p><div className="coming-card"><span className="coming-icon"><Icon name={page === 'Invoices' ? 'invoices' : page === 'Transactions' ? 'transactions' : page === 'Connections' ? 'connections' : 'settings'} size={24} /></span><h2>{page} will appear here</h2><p>We’re laying the groundwork for your financial workspace.</p></div></main>
}

function PasswordField({ id, placeholder }: { id: string; placeholder: string }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>Password</label>
      <div className="password-input-wrap">
        <input id={id} name="password" type="password" placeholder={placeholder} autoComplete={id === 'login-password' ? 'current-password' : 'new-password'} />
        <button className="password-visibility" type="button" aria-label="Show password"><Icon name="eye" size={18} /></button>
      </div>
    </div>
  )
}

function AuthPage({ mode, onModeChange, onPreviewDashboard }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onPreviewDashboard: () => void }) {
  const [role, setRole] = useState<'owner' | 'accountant'>('owner')
  const isSignup = mode === 'signup'

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <div className="auth-brand"><span className="brand-mark" aria-hidden="true" /><span>AutoLedge</span></div>
      </header>
      <div className="auth-main">
        <section className={`auth-card${isSignup ? ' signup-card' : ''}`} aria-labelledby="auth-title">
          <div className="auth-heading">
            <h1 id="auth-title">{isSignup ? 'Create your workspace' : 'Welcome back'}</h1>
            <p>{isSignup ? 'Start with your account and business details' : 'Sign in to your workspace'}</p>
          </div>
          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            {isSignup && <div className="auth-field"><label htmlFor="signup-name">Your name</label><input id="signup-name" name="name" type="text" placeholder="Your name" autoComplete="name" /></div>}
            <div className="auth-field"><label htmlFor={`${mode}-email`}>Work email</label><input id={`${mode}-email`} name="email" type="email" placeholder="you@business.com" autoComplete="email" /></div>
            <PasswordField id={`${mode}-password`} placeholder={isSignup ? 'Create a password' : 'Enter your password'} />
            {isSignup ? (
              <>
                <div className="auth-field"><label htmlFor="signup-business">Business name</label><input id="signup-business" name="business" type="text" placeholder="Your business name" autoComplete="organization" /></div>
                <fieldset className="role-fieldset"><legend>Your role <span>(optional)</span></legend><div className="role-options">
                  <button type="button" className={`role-option${role === 'owner' ? ' selected' : ''}`} aria-pressed={role === 'owner'} onClick={() => setRole('owner')}><span className="radio-indicator" />Business owner</button>
                  <button type="button" className={`role-option${role === 'accountant' ? ' selected' : ''}`} aria-pressed={role === 'accountant'} onClick={() => setRole('accountant')}><span className="radio-indicator" />Accountant / bookkeeper</button>
                </div></fieldset>
              </>
            ) : <div className="auth-options"><label className="remember-option"><input type="checkbox" name="remember" /> <span>Remember me</span></label><button type="button" className="auth-text-button">Forgot password?</button></div>}
            <button className="auth-submit" type="submit">{isSignup ? 'Create account' : 'Sign in'}</button>
          </form>
          <div className="auth-switch">{isSignup ? <><span>Already have an account?</span> <button type="button" onClick={() => onModeChange('login')}>Sign in</button></> : <><span>New to AutoLedge?</span> <button type="button" onClick={() => onModeChange('signup')}>Create account</button></>}</div>
          {isSignup && <p className="auth-footnote">Bank accounts can be connected later.</p>}
        </section>
        <button className="demo-preview-link" type="button" onClick={onPreviewDashboard}>Skip sign-in · view sample dashboard <Icon name="arrow" size={15} /></button>
      </div>
    </main>
  )
}

function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  if (!showDashboard) return <AuthPage mode={authMode} onModeChange={setAuthMode} onPreviewDashboard={() => setShowDashboard(true)} />
  return <div className="app-shell"><Sidebar page={page} onNavigate={setPage} onSignOut={() => setShowDashboard(false)} /><div className="main-column"><Topbar />{page === 'Overview' ? <Overview /> : page === 'Reconciliation' ? <Reconciliation /> : <ComingSoon page={page} />}</div></div>
}

export default App
