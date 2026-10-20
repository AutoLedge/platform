import { useState } from 'react'
import { Link } from 'react-router'
import transactionsData from '@/data/transactions.json'
import {
  FilterSelect,
  ResetFilters,
  SearchInput,
  SelectControl,
  StatusBadge,
  StatusTabs,
  TablePagination,
  paginate,
} from '@/components/LedgerControls'
import { fuzzyFilter } from '@/lib/fuzzy-search'
import { formatDate, formatSignedCurrency, formatTime, parseLocalDate } from '@/lib/format'
import '@/styles/transactions.css'

// ── Data shapes (mirror the fake JSON until the FastAPI endpoint exists) ──

type MatchStatus = 'matched' | 'unmatched'

type BankAccount = {
  id: string
  name: string
  mask: string
  currency: string
}

type Transaction = {
  id: string
  accountId: string
  /** Local ISO date-time without offset, e.g. "2026-10-20T10:42" */
  datetime: string
  vendor: string
  category: string
  /** Signed amount: positive = money in, negative = money out */
  amount: number
  status: MatchStatus
  /** Invoice this transaction is matched to (see data/invoices.json) */
  invoiceNumber: string | null
}

const accounts = transactionsData.accounts as BankAccount[]
const transactions = transactionsData.transactions as Transaction[]

// ── Filter definitions ──

const PAGE_SIZE = 6

type DateRangeId = 'october' | 'october-business-hours' | 'last-7-days'

const dateRanges: { id: DateRangeId; label: string; test: (date: Date) => boolean }[] = [
  {
    id: 'october',
    label: 'Oct 1–31, 2026 · All times',
    test: (date) => date.getFullYear() === 2026 && date.getMonth() === 9,
  },
  {
    id: 'october-business-hours',
    label: 'Oct 1–31, 2026 · 9 AM–5 PM',
    test: (date) => date.getFullYear() === 2026 && date.getMonth() === 9 && date.getHours() >= 9 && date.getHours() < 17,
  },
  {
    id: 'last-7-days',
    label: 'Oct 14–20, 2026 · All times',
    test: (date) => date >= new Date(2026, 9, 14) && date < new Date(2026, 9, 21),
  },
]

type AmountRangeId = 'any' | 'in' | 'out' | 'under-100' | '100-1000' | 'over-1000'

const amountRanges: { id: AmountRangeId; label: string; test: (amount: number) => boolean }[] = [
  { id: 'any', label: 'Any amount', test: () => true },
  { id: 'in', label: 'Money in', test: (amount) => amount > 0 },
  { id: 'out', label: 'Money out', test: (amount) => amount < 0 },
  { id: 'under-100', label: 'Under $100', test: (amount) => Math.abs(amount) < 100 },
  { id: '100-1000', label: '$100 – $1,000', test: (amount) => Math.abs(amount) >= 100 && Math.abs(amount) <= 1000 },
  { id: 'over-1000', label: 'Over $1,000', test: (amount) => Math.abs(amount) > 1000 },
]

type StatusTab = 'all' | MatchStatus

const statusTabs: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'matched', label: 'Matched' },
  { id: 'unmatched', label: 'Unmatched' },
]

type Filters = {
  dateRange: DateRangeId
  category: string
  vendor: string
  amountRange: AmountRangeId
}

const defaultFilters: Filters = { dateRange: 'october', category: 'all', vendor: 'all', amountRange: 'any' }

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

/** Every value a person might type to find a transaction. */
function searchFields(transaction: Transaction) {
  const date = parseLocalDate(transaction.datetime)
  return [
    transaction.vendor,
    transaction.category,
    formatDate(date),
    formatTime(date),
    formatSignedCurrency(transaction.amount),
    transaction.status === 'matched' ? 'Matched' : 'Unmatched',
    transaction.invoiceNumber,
  ]
}

// ── Route component ──

export default function Transactions() {
  const [accountId, setAccountId] = useState(accounts[0].id)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)

  const account = accounts.find((item) => item.id === accountId) ?? accounts[0]
  const accountTransactions = transactions.filter((transaction) => transaction.accountId === accountId)
  const categoryOptions = uniqueSorted(accountTransactions.map((transaction) => transaction.category))
  const vendorOptions = uniqueSorted(accountTransactions.map((transaction) => transaction.vendor))

  const dateRange = dateRanges.find((range) => range.id === filters.dateRange) ?? dateRanges[0]
  const amountRange = amountRanges.find((range) => range.id === filters.amountRange) ?? amountRanges[0]

  // Rows that pass the filters and search; the status tabs count against this set.
  const filtered = fuzzyFilter(
    accountTransactions.filter(
      (transaction) =>
        dateRange.test(parseLocalDate(transaction.datetime)) &&
        (filters.category === 'all' || transaction.category === filters.category) &&
        (filters.vendor === 'all' || transaction.vendor === filters.vendor) &&
        amountRange.test(transaction.amount),
    ),
    search,
    searchFields,
  )

  const counts: Record<StatusTab, number> = {
    all: filtered.length,
    matched: filtered.filter((transaction) => transaction.status === 'matched').length,
    unmatched: filtered.filter((transaction) => transaction.status === 'unmatched').length,
  }

  const visible = filtered
    .filter((transaction) => statusTab === 'all' || transaction.status === statusTab)
    .sort((a, b) => (sortDirection === 'desc' ? b.datetime.localeCompare(a.datetime) : a.datetime.localeCompare(b.datetime)))

  const { rows, start, currentPage, pageCount } = paginate(visible, page, PAGE_SIZE)

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function changeAccount(nextAccountId: string) {
    setAccountId(nextAccountId)
    setFilters(defaultFilters) // category/vendor lists differ per account
    setStatusTab('all')
    setPage(1)
  }

  function resetFilters() {
    setFilters(defaultFilters)
    setStatusTab('all')
    setSearch('')
    setPage(1)
  }

  return (
    <main className="ledger-page">
      <div className="ledger-header">
        <div className="ledger-intro">
          <h1>Transactions</h1>
          <p>View your bank activity and track transactions matched to invoices</p>
        </div>
        <SelectControl
          className="ledger-account-select"
          ariaLabel="Bank account"
          value={accountId}
          options={accounts.map((item) => ({ value: item.id, label: `${item.name} • ${item.mask}` }))}
          onChange={changeAccount}
        />
      </div>

      <div className="ledger-filters">
        <FilterSelect
          className="ledger-filter-wide"
          label="Date / time"
          value={filters.dateRange}
          options={dateRanges.map((range) => ({ value: range.id, label: range.label }))}
          onChange={(value) => updateFilter('dateRange', value as DateRangeId)}
        />
        <FilterSelect
          className="ledger-filter-narrow"
          label="Category"
          value={filters.category}
          options={[{ value: 'all', label: 'All categories' }, ...categoryOptions.map((category) => ({ value: category, label: category }))]}
          onChange={(value) => updateFilter('category', value)}
        />
        <FilterSelect
          className="ledger-filter-medium"
          label="Vendor / merchant"
          value={filters.vendor}
          options={[{ value: 'all', label: 'All counterparties' }, ...vendorOptions.map((vendor) => ({ value: vendor, label: vendor }))]}
          onChange={(value) => updateFilter('vendor', value)}
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

      <section className="ledger-card" aria-label="Bank account transactions">
        <div className="ledger-toolbar">
          <StatusTabs
            ariaLabel="Filter by invoice status"
            tabs={statusTabs}
            value={statusTab}
            counts={counts}
            onChange={(tab) => {
              setStatusTab(tab)
              setPage(1)
            }}
          />
          <div className="ledger-toolbar-end">
            <SearchInput
              placeholder="Search transactions"
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
            />
            <p className="ledger-currency-note">All amounts in {account.currency}</p>
          </div>
        </div>

        <div className="ledger-table-scroll">
          <table className="ledger-table transactions-table">
            <colgroup>
              <col className="col-date" />
              <col className="col-vendor" />
              <col className="col-category" />
              <col className="col-amount" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortDirection === 'desc' ? 'descending' : 'ascending'}>
                  <button type="button" className="ledger-sort" onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}>
                    Date / time {sortDirection === 'desc' ? '↓' : '↑'}
                  </button>
                </th>
                <th scope="col">Vendor / counterparty</th>
                <th scope="col">Category</th>
                <th scope="col" className="align-right">
                  Amount
                </th>
                <th scope="col">Invoice status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((transaction) => {
                const date = parseLocalDate(transaction.datetime)
                return (
                  <tr key={transaction.id}>
                    <td>
                      <span className="ledger-item transaction-date">{formatDate(date)}</span>
                      <span className="ledger-caption">{formatTime(date)}</span>
                    </td>
                    <td className="ledger-strong">{transaction.vendor}</td>
                    <td className="ledger-item">{transaction.category}</td>
                    <td className="ledger-strong ledger-amount align-right">{formatSignedCurrency(transaction.amount)}</td>
                    <td>
                      <span className="transaction-match">
                        <StatusBadge tone={transaction.status === 'matched' ? 'positive' : 'neutral'}>
                          {transaction.status === 'matched' ? 'Matched' : 'Unmatched'}
                        </StatusBadge>
                        {transaction.invoiceNumber && (
                          <Link
                            className="invoice-link"
                            to={`/invoices?invoice=${encodeURIComponent(transaction.invoiceNumber)}`}
                            title={`View invoice ${transaction.invoiceNumber}`}
                          >
                            {transaction.invoiceNumber}
                          </Link>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="ledger-empty">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          noun="transactions"
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
