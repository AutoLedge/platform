import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import invoicesData from '@/data/invoices.json'
import uploadIcon from '@/assets/icons/upload.svg'
import fileTextIcon from '@/assets/icons/file-text.svg'
import {
  FilterSelect,
  ResetFilters,
  SearchInput,
  StatusBadge,
  StatusTabs,
  TablePagination,
  paginate,
  type BadgeTone,
} from '@/components/LedgerControls'
import { fuzzyFilter } from '@/lib/fuzzy-search'
import { formatCurrency, formatDate, parseLocalDate } from '@/lib/format'
import '@/styles/invoices.css'

// ── Data shapes (mirror the fake JSON until the FastAPI endpoint exists) ──

type InvoiceType = 'sales' | 'purchase'
type PaymentStatus = 'paid' | 'unpaid' | 'overdue'

type Invoice = {
  id: string
  number: string
  type: InvoiceType
  counterparty: string
  /** Local ISO dates, e.g. "2026-10-20" */
  issueDate: string
  dueDate: string
  amount: number
  status: PaymentStatus
  documentName: string
  /** Bank transaction this invoice was matched to (see data/transactions.json) */
  matchedTransactionId: string | null
}

const invoices = invoicesData.invoices as Invoice[]

/** Query param set by the Transactions page's invoice links: /invoices?invoice=INV-1048 */
const INVOICE_PARAM = 'invoice'

// ── Filter definitions ──

const PAGE_SIZE = 6

type IssueRangeId = 'october' | 'october-first-half' | 'october-second-half'

const issueRanges: { id: IssueRangeId; label: string; test: (date: Date) => boolean }[] = [
  { id: 'october', label: 'Oct 1–31, 2026', test: (date) => date.getFullYear() === 2026 && date.getMonth() === 9 },
  { id: 'october-first-half', label: 'Oct 1–15, 2026', test: (date) => date >= new Date(2026, 9, 1) && date < new Date(2026, 9, 16) },
  { id: 'october-second-half', label: 'Oct 16–31, 2026', test: (date) => date >= new Date(2026, 9, 16) && date < new Date(2026, 10, 1) },
]

type TypeFilterId = 'all' | InvoiceType

const typeFilters: { value: TypeFilterId; label: string }[] = [
  { value: 'all', label: 'Sales & purchases' },
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
]

type AmountRangeId = 'any' | 'under-100' | '100-1000' | 'over-1000'

const amountRanges: { id: AmountRangeId; label: string; test: (amount: number) => boolean }[] = [
  { id: 'any', label: 'Any amount', test: () => true },
  { id: 'under-100', label: 'Under $100', test: (amount) => amount < 100 },
  { id: '100-1000', label: '$100 – $1,000', test: (amount) => amount >= 100 && amount <= 1000 },
  { id: 'over-1000', label: 'Over $1,000', test: (amount) => amount > 1000 },
]

type StatusTab = 'all' | PaymentStatus

const statusTabs: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'overdue', label: 'Overdue' },
]

const statusDisplay: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'positive' },
  unpaid: { label: 'Unpaid', tone: 'neutral' },
  overdue: { label: 'Overdue', tone: 'warning' },
}

type Filters = {
  issueRange: IssueRangeId
  type: TypeFilterId
  counterparty: string
  amountRange: AmountRangeId
}

const defaultFilters: Filters = { issueRange: 'october', type: 'all', counterparty: 'all', amountRange: 'any' }

const counterpartyOptions = [...new Set(invoices.map((invoice) => invoice.counterparty))].sort((a, b) => a.localeCompare(b))

function typeLabel(type: InvoiceType) {
  return type === 'sales' ? 'Sales' : 'Purchase'
}

/** Every value a person might type to find an invoice. */
function searchFields(invoice: Invoice) {
  return [
    invoice.number,
    typeLabel(invoice.type),
    invoice.counterparty,
    formatDate(parseLocalDate(invoice.issueDate)),
    formatDate(parseLocalDate(invoice.dueDate)),
    formatCurrency(invoice.amount),
    statusDisplay[invoice.status].label,
    invoice.documentName,
  ]
}

// ── Route component ──

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams()
  const invoiceParam = searchParams.get(INVOICE_PARAM)

  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const uploadInput = useRef<HTMLInputElement>(null)

  const issueRange = issueRanges.find((range) => range.id === filters.issueRange) ?? issueRanges[0]
  const amountRange = amountRanges.find((range) => range.id === filters.amountRange) ?? amountRanges[0]

  // Opened from a transaction's invoice link: show only that invoice, ignoring the other filters.
  const filtered = invoiceParam
    ? invoices.filter((invoice) => invoice.number === invoiceParam)
    : fuzzyFilter(
        invoices.filter(
          (invoice) =>
            issueRange.test(parseLocalDate(invoice.issueDate)) &&
            (filters.type === 'all' || invoice.type === filters.type) &&
            (filters.counterparty === 'all' || invoice.counterparty === filters.counterparty) &&
            amountRange.test(invoice.amount),
        ),
        search,
        searchFields,
      )

  const counts: Record<StatusTab, number> = {
    all: filtered.length,
    paid: filtered.filter((invoice) => invoice.status === 'paid').length,
    unpaid: filtered.filter((invoice) => invoice.status === 'unpaid').length,
    overdue: filtered.filter((invoice) => invoice.status === 'overdue').length,
  }

  const visible = filtered
    .filter((invoice) => statusTab === 'all' || invoice.status === statusTab)
    .sort((a, b) => {
      const byDate = a.issueDate.localeCompare(b.issueDate) || a.number.localeCompare(b.number)
      return sortDirection === 'desc' ? -byDate : byDate
    })

  const { rows, start, currentPage, pageCount } = paginate(visible, page, PAGE_SIZE)

  function clearInvoiceParam() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(INVOICE_PARAM)
        return next
      },
      { replace: true },
    )
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    clearInvoiceParam()
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function updateSearch(value: string) {
    clearInvoiceParam()
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    clearInvoiceParam()
    setFilters(defaultFilters)
    setStatusTab('all')
    setSearch('')
    setPage(1)
  }

  return (
    <main className="ledger-page">
      <div className="ledger-header">
        <div className="ledger-intro">
          <h1>Invoices</h1>
          <p>Manage sales and purchase invoices, track payments and view documents</p>
        </div>
        <button className="ledger-header-action" type="button" onClick={() => uploadInput.current?.click()}>
          <img src={uploadIcon} alt="" width={16} height={16} />
          Upload invoices
        </button>
        {/* TODO: send selected files to the invoice upload endpoint (Supabase storage) once it exists. */}
        <input ref={uploadInput} type="file" accept="application/pdf,image/*" multiple hidden />
      </div>

      <div className="ledger-filters">
        <FilterSelect
          className="ledger-filter-wide"
          label="Issue date"
          value={filters.issueRange}
          options={issueRanges.map((range) => ({ value: range.id, label: range.label }))}
          onChange={(value) => updateFilter('issueRange', value as IssueRangeId)}
        />
        <FilterSelect
          className="ledger-filter-narrow"
          label="Invoice type"
          value={filters.type}
          options={typeFilters}
          onChange={(value) => updateFilter('type', value as TypeFilterId)}
        />
        <FilterSelect
          className="ledger-filter-medium"
          label="Customer / supplier"
          value={filters.counterparty}
          options={[{ value: 'all', label: 'All counterparties' }, ...counterpartyOptions.map((name) => ({ value: name, label: name }))]}
          onChange={(value) => updateFilter('counterparty', value)}
        />
        <FilterSelect
          className="ledger-filter-narrow"
          label="Amount (CAD)"
          value={filters.amountRange}
          options={amountRanges.map((range) => ({ value: range.id, label: range.label }))}
          onChange={(value) => updateFilter('amountRange', value as AmountRangeId)}
        />
        <ResetFilters onReset={resetFilters} />
      </div>

      <section className="ledger-card" aria-label="Invoice register">
        <div className="ledger-toolbar">
          <StatusTabs
            ariaLabel="Filter by payment status"
            tabs={statusTabs}
            value={statusTab}
            counts={counts}
            onChange={(tab) => {
              setStatusTab(tab)
              setPage(1)
            }}
          />
          <div className="ledger-toolbar-end">
            {invoiceParam ? (
              <span className="ledger-chip">
                Invoice {invoiceParam}
                <button type="button" aria-label="Show all invoices" title="Show all invoices" onClick={clearInvoiceParam}>
                  ×
                </button>
              </span>
            ) : (
              <SearchInput placeholder="Search invoices" value={search} onChange={updateSearch} />
            )}
            <p className="ledger-currency-note">All amounts in CAD</p>
          </div>
        </div>

        <div className="ledger-table-scroll">
          <table className="ledger-table invoices-table">
            <colgroup>
              <col className="col-invoice" />
              <col className="col-counterparty" />
              <col className="col-issue" />
              <col className="col-due" />
              <col className="col-amount" />
              <col className="col-status" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Customer / supplier</th>
                <th scope="col" aria-sort={sortDirection === 'desc' ? 'descending' : 'ascending'}>
                  <button type="button" className="ledger-sort" onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}>
                    Issue date {sortDirection === 'desc' ? '↓' : '↑'}
                  </button>
                </th>
                <th scope="col">Due date</th>
                <th scope="col" className="align-right">
                  Amount
                </th>
                <th scope="col">Payment status</th>
                <th scope="col">Document</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((invoice) => {
                const status = statusDisplay[invoice.status]
                return (
                  <tr key={invoice.id} className={invoice.number === invoiceParam ? 'is-highlighted' : undefined}>
                    <td>
                      <span className="ledger-strong invoice-number">{invoice.number}</span>
                      <span className="ledger-caption">{typeLabel(invoice.type)}</span>
                    </td>
                    <td className="ledger-strong">{invoice.counterparty}</td>
                    <td className="ledger-item">{formatDate(parseLocalDate(invoice.issueDate))}</td>
                    <td className={`ledger-item${invoice.status === 'overdue' ? ' invoice-overdue' : ''}`}>
                      {formatDate(parseLocalDate(invoice.dueDate))}
                    </td>
                    <td className="ledger-strong ledger-amount align-right">{formatCurrency(invoice.amount)}</td>
                    <td>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </td>
                    <td>
                      {/* TODO: open the stored document (e.g. a Supabase signed URL) once uploads are wired up. */}
                      <button type="button" className="invoice-document" title={`Open ${invoice.documentName}`}>
                        <img src={fileTextIcon} alt="" width={15} height={18} />
                        <span>{invoice.documentName}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="ledger-empty">
                    {invoiceParam ? `Invoice ${invoiceParam} wasn’t found.` : 'No invoices match these filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          noun="invoices"
          total={visible.length}
          start={start}
          shown={rows.length}
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </section>
    </main>
  )
}
