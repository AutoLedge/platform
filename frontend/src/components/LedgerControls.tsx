import type { ReactNode } from 'react'
import DashboardIcon from '@/components/DashboardIcon'
import '@/styles/LedgerControls.css'

/*
 * Shared building blocks for the ledger-style pages (Transactions, Invoices):
 * dropdown filters, status tabs, the search field, status badges and pagination.
 * Page layout classes (ledger-page, ledger-header, ledger-card, ledger-table …) live in styles/LedgerControls.css.
 */

export type SelectOption = { value: string; label: string }

export function SelectControl({
  value,
  options,
  onChange,
  className = '',
  ariaLabel,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <span className={`ledger-select ${className}`}>
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="ledger-select-arrow" aria-hidden="true" />
    </span>
  )
}

export function FilterSelect({
  label,
  className = '',
  ...select
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label className={`ledger-filter ${className}`}>
      <span className="ledger-filter-label">{label}</span>
      <SelectControl className="ledger-filter-control" {...select} />
    </label>
  )
}

export function ResetFilters({ onReset }: { onReset: () => void }) {
  return (
    <div className="ledger-reset">
      <button type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  )
}

export function StatusTabs<T extends string>({
  tabs,
  value,
  counts,
  onChange,
  ariaLabel,
}: {
  tabs: { id: T; label: string }[]
  value: T
  counts: Record<T, number>
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div className="ledger-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`ledger-tab${value === tab.id ? ' selected' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          <span>{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="ledger-search">
      <DashboardIcon name="search" size={15} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onChange('')
        }}
      />
    </label>
  )
}

export type BadgeTone = 'positive' | 'neutral' | 'warning'

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`ledger-badge ${tone}`}>{children}</span>
}

/** Clamps `page` and returns the visible slice of `items` with paging metadata. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), pageCount)
  const start = (currentPage - 1) * pageSize
  return { pageCount, currentPage, start, rows: items.slice(start, start + pageSize) }
}

export function TablePagination({
  total,
  start,
  shown,
  currentPage,
  pageCount,
  noun,
  onPageChange,
}: {
  total: number
  start: number
  shown: number
  currentPage: number
  pageCount: number
  noun: string
  onPageChange: (page: number) => void
}) {
  return (
    <div className="ledger-pagination">
      <p>
        {total === 0
          ? `Showing 0 ${noun}`
          : total === 1
            ? `Showing 1 ${noun.replace(/s$/, '')}`
            : `Showing ${start + 1}–${start + shown} of ${total} ${noun}`}
      </p>
      <div className="ledger-pagination-controls">
        <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          ← Previous
        </button>
        <span>
          {currentPage} of {pageCount}
        </span>
        <button type="button" disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)}>
          Next →
        </button>
      </div>
    </div>
  )
}
