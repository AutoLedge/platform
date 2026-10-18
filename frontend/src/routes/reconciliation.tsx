import { useState } from 'react'
import DateSelector from '@/components/DateSelector'
import DashboardIcon from '@/components/DashboardIcon'

const reconciliationRows = [
  { date: 'Oct 12, 2026', description: 'Northstar Office Supply', reference: 'INV-1048', amount: '$1,284.50', status: 'Matched' },
  { date: 'Oct 11, 2026', description: 'Client payment · Acme Studio', reference: 'PAY-2081', amount: '+$3,600.00', status: 'Matched' },
  { date: 'Oct 10, 2026', description: 'Cloud hosting subscription', reference: '—', amount: '$249.00', status: 'Needs review' },
  { date: 'Oct 09, 2026', description: 'Client payment · Jordan Lee', reference: '—', amount: '+$875.00', status: 'Unmatched' },
]

const filters = ['All', 'Matched', 'Needs review', 'Unmatched']

export default function Reconciliation() {
  const [filter, setFilter] = useState('All')
  const visibleRows = reconciliationRows.filter((row) => filter === 'All' || row.status === filter)

  return (
    <main className="page-content reconciliation-page">
      <div className="page-heading reconciliation-heading">
        <div><p className="eyebrow">FINANCIAL WORKSPACE</p><h1>Reconciliation</h1><p className="page-subtitle">Match your bank transactions with invoices, payments and records</p></div>
        <DateSelector label="October 2026" />
      </div>
      <div className="reconciliation-layout">
        <section className="reconciliation-main">
          <div className="reconciliation-metrics">
            <article className="recon-metric"><span className="recon-number">42</span><span>Records matched</span></article>
            <article className="recon-metric"><span className="recon-number green">38</span><span>Matched automatically</span></article>
            <article className="recon-metric"><span className="recon-number yellow">2</span><span>Require review</span></article>
            <article className="recon-metric"><span className="recon-number red">2</span><span>Unmatched</span></article>
          </div>
          <div className="reconciliation-toolbar">
            <div className="filter-tabs" role="tablist" aria-label="Filter reconciliation records">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={filter === item}
                  className={`filter-tab${filter === item ? ' selected' : ''}`}
                  onClick={() => setFilter(item)}
                >
                  {item}<span>{item === 'All' ? '42' : item === 'Matched' ? '38' : '2'}</span>
                </button>
              ))}
            </div>
            <button className="outline-button" type="button">Export</button>
          </div>
          <div className="records-panel">
            <div className="records-panel-heading">
              <div><h2>October activity</h2><p>Review how transactions match with your records.</p></div>
              <button className="icon-button search-button" type="button" aria-label="Search records"><span className="search-icon" /></button>
            </div>
            <div className="table-scroll">
              <table className="records-table">
                <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={`${row.date}-${row.description}`}>
                      <td>{row.date}</td>
                      <td className="description-cell">{row.description}</td>
                      <td>{row.reference}</td>
                      <td className="amount-cell">{row.amount}</td>
                      <td><span className={`status-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleRows.length === 0 && <p className="empty-state">No records in this category.</p>}
            <div className="table-footer"><span>Showing {visibleRows.length} of 42 records</span><div><button className="pagination-button" type="button" disabled>Previous</button><button className="pagination-button" type="button">Next</button></div></div>
          </div>
          <p className="data-note">Reconciliation records are sample data for preview.</p>
        </section>
        <aside className="discrepancy-card">
          <p className="discrepancy-label">Potential discrepancy</p>
          <p className="discrepancy-value">$23,983</p>
          <div className="discrepancy-divider" />
          <p className="discrepancy-label">Possible matches</p>
          <div className="possible-match">
            <span className="match-icon"><DashboardIcon name="reconciliation" size={18} /></span>
            <div><strong>4 records</strong><span>Could be matched</span></div>
            <DashboardIcon name="arrow" size={16} />
          </div>
          <button className="review-button" type="button">Review matches <DashboardIcon name="arrow" size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
