import DateSelector from '@/components/DateSelector'
import DashboardIcon from '@/components/DashboardIcon'

const attentionItems = [
  { tone: 'danger', icon: 'alert' as const, text: '3 transactions couldn’t be reconciled' },
  { tone: 'warning', icon: 'alert' as const, text: 'Invoice #432 is 14 days overdue' },
  { tone: 'success', icon: 'check' as const, text: 'Bank reconciliation completed' },
]

export default function Overview() {
  return (
    <main className="page-content overview-page">
      <div className="page-heading overview-heading">
        <div>
          <p className="eyebrow">MONDAY, OCTOBER 12, 2026</p>
          <h1>Good morning, Ahmed</h1>
          <p className="page-subtitle">Here’s what’s going on with your business...</p>
        </div>
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
          <div className="panel-heading">
            <div><h2>Cash flow</h2><p className="panel-caption">Balance over the last 30 days</p></div>
            <button className="subtle-select" type="button">Monthly <span className="chevron" /></button>
          </div>
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
          <div className="panel-heading">
            <div><h2>Needs attention</h2><p className="panel-caption">A few things to review</p></div>
            <button className="text-link" type="button">View all <DashboardIcon name="arrow" size={16} /></button>
          </div>
          <ul className="attention-list">
            {attentionItems.map((item) => (
              <li className={`attention-item ${item.tone}`} key={item.text}>
                <DashboardIcon name={item.icon} size={20} />
                <span>{item.text}</span>
                <DashboardIcon name="arrow" size={16} />
              </li>
            ))}
          </ul>
        </article>
      </section>
      <p className="data-note">Dashboard figures are sample data for preview.</p>
    </main>
  )
}
