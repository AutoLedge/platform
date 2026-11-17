import type { FormEvent } from 'react'
import { Link, useLoaderData, useLocation, useParams, useSubmit } from 'react-router'
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { Schemas } from '@/lib/api'
import { formatDate, formatMoney, parseLocalDate } from '@/lib/format'
import { StatusBadge } from '@/components/LedgerControls'
import { accountsQuery } from '@/queries/plaid'
import { transactionsQuery, type TransactionFilters } from '@/queries/transactions'
import type { transactionsLoader } from '@/routes/transactions-loaders'
import '@/styles/transactions.css'

type Transaction = Schemas['TransactionResponse']

// Plaid's primary categories. The API sends the detailed one (e.g. FOOD_AND_DRINK_COFFEE),
// whose prefix is one of these.
const PRIMARY_CATEGORIES = [
  'INCOME', 'TRANSFER_IN', 'TRANSFER_OUT', 'LOAN_PAYMENTS', 'LOAN_DISBURSEMENTS', 'BANK_FEES',
  'ENTERTAINMENT', 'FOOD_AND_DRINK', 'GENERAL_MERCHANDISE', 'HOME_IMPROVEMENT', 'MEDICAL',
  'PERSONAL_CARE', 'GENERAL_SERVICES', 'GOVERNMENT_AND_NON_PROFIT', 'TRANSPORTATION', 'TRAVEL',
  'RENT_AND_UTILITIES',
]

function sentenceCase(code: string) {
  const words = code.toLowerCase().replace(/_/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "FOOD_AND_DRINK_COFFEE" → "Food and drink · Coffee". */
function formatCategory(category: string | null) {
  if (!category) return '—'
  const primary = PRIMARY_CATEGORIES.find((prefix) => category.startsWith(`${prefix}_`))
  if (!primary) return sentenceCase(category)
  return `${sentenceCase(primary)} · ${sentenceCase(category.slice(primary.length + 1))}`
}

function formatAccount(name: string, mask: string | null) {
  return mask ? `${name} ••${mask}` : name
}

// ── Route component ──

export default function Transactions() {
  const businessId = useParams().businessId!
  const { filters, invalidRange } = useLoaderData<typeof transactionsLoader>()
  const pagePath = `/b/${businessId}/transactions`

  return (
    <main className="ledger-page">
      <div className="ledger-header">
        <div className="ledger-intro">
          <h1>Transactions</h1>
          <p>Bank activity imported from your connected accounts</p>
        </div>
      </div>

      <TransactionFiltersForm businessId={businessId} filters={filters} pagePath={pagePath} />

      <section className="ledger-card" aria-label="Bank transactions">
        {invalidRange ? (
          <p className="ledger-empty transactions-message" role="alert">
            'From' must be on or before 'To'.
          </p>
        ) : (
          <TransactionTable businessId={businessId} filters={filters} pagePath={pagePath} />
        )}
      </section>
    </main>
  )
}

// ── Filters (kept in the URL) ──

function TransactionFiltersForm({
  businessId,
  filters,
  pagePath,
}: {
  businessId: string
  filters: TransactionFilters
  pagePath: string
}) {
  const { data: accounts } = useSuspenseQuery(accountsQuery(businessId))
  const submit = useSubmit()
  const { search } = useLocation()

  // Leave empty fields out of the URL, so a cleared field doesn't linger as `?q=`.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string' && value.trim()) params.set(name, value.trim())
    }
    submit(params, { method: 'get', action: pagePath })
  }

  return (
    // Keyed by the URL so Back/Forward refill the fields.
    <form key={search} method="get" action={pagePath} className="ledger-filters transactions-filters" onSubmit={handleSubmit}>
      <label className="ledger-filter transactions-filter-date">
        <span className="ledger-filter-label">From</span>
        <input className="transactions-input" type="date" name="from" defaultValue={filters.from ?? ''} />
      </label>
      <label className="ledger-filter transactions-filter-date">
        <span className="ledger-filter-label">To</span>
        <input className="transactions-input" type="date" name="to" defaultValue={filters.to ?? ''} />
      </label>
      <label className="ledger-filter ledger-filter-medium">
        <span className="ledger-filter-label">Account</span>
        <span className="ledger-select ledger-filter-control">
          <select name="account_id" defaultValue={filters.account_id ?? ''}>
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {formatAccount(account.name, account.mask)}
                {account.connected ? '' : ' (disconnected)'}
              </option>
            ))}
          </select>
          <span className="ledger-select-arrow" aria-hidden="true" />
        </span>
      </label>
      <label className="ledger-filter transactions-filter-status">
        <span className="ledger-filter-label">Status</span>
        <span className="ledger-select ledger-filter-control">
          <select name="pending" defaultValue={filters.pending ?? ''}>
            <option value="">All</option>
            <option value="true">Pending</option>
            <option value="false">Posted</option>
          </select>
          <span className="ledger-select-arrow" aria-hidden="true" />
        </span>
      </label>
      <label className="ledger-filter ledger-filter-medium">
        <span className="ledger-filter-label">Search</span>
        <input
          className="transactions-input"
          type="search"
          name="q"
          maxLength={100}
          placeholder="Merchant or description"
          defaultValue={filters.q ?? ''}
        />
      </label>
      <div className="transactions-filter-actions">
        <button type="submit" className="ledger-header-action transactions-apply">
          Apply
        </button>
        <Link to={pagePath} className="transactions-clear">
          Clear
        </Link>
      </div>
    </form>
  )
}

// ── Results ──

function TransactionTable({
  businessId,
  filters,
  pagePath,
}: {
  businessId: string
  filters: TransactionFilters
  pagePath: string
}) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } = useSuspenseInfiniteQuery(
    transactionsQuery(businessId, filters),
  )
  const rows = data.pages.flatMap((page) => page.items)
  const filtered = Object.keys(filters).length > 0

  return (
    <>
      <div className="ledger-table-scroll">
        <table className="ledger-table transactions-table">
          <colgroup>
            <col className="col-date" />
            <col className="col-vendor" />
            <col className="col-account" />
            <col className="col-category" />
            <col className="col-amount" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Merchant / description</th>
              <th scope="col">Account</th>
              <th scope="col">Category</th>
              <th scope="col" className="align-right">
                Amount
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="ledger-empty">
                  {filtered ? (
                    <>
                      No transactions match these filters. <Link to={pagePath}>Clear filters</Link>
                    </>
                  ) : (
                    <>
                      No transactions yet. Connect a bank in <Link to={`/b/${businessId}/connections`}>Connections</Link>.
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ledger-pagination">
        <p>
          Showing {rows.length} {rows.length === 1 ? 'transaction' : 'transactions'}
        </p>
        <div className="ledger-pagination-controls">
          {isFetchNextPageError && !isFetchingNextPage && (
            <span className="transactions-load-error" role="alert">
              Couldn't load more transactions.
            </span>
          )}
          {hasNextPage && (
            <button type="button" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  // Plaid's sign: positive is money out of the account, negative is money in.
  const outflow = !transaction.amount.startsWith('-')
  const amount = formatMoney(transaction.amount, transaction.currency, { unsigned: true })

  return (
    <tr>
      <td>
        <span className="ledger-item transaction-date">{formatDate(parseLocalDate(transaction.date))}</span>
      </td>
      <td>
        <span className="ledger-strong transaction-text">{transaction.merchant_name || transaction.description}</span>
        {transaction.merchant_name && <span className="ledger-caption transaction-text">{transaction.description}</span>}
      </td>
      <td>
        <span className="ledger-item transaction-text">{formatAccount(transaction.account_name, transaction.account_mask)}</span>
      </td>
      <td>
        <span className="ledger-item transaction-text">{formatCategory(transaction.category)}</span>
      </td>
      <td className={`ledger-amount align-right ${outflow ? 'negative' : 'positive'}`}>
        <span className="visually-hidden">{outflow ? 'Money out' : 'Money in'} </span>
        {outflow ? '−' : '+'}
        {amount}
      </td>
      <td>{transaction.pending && <StatusBadge tone="warning">Pending</StatusBadge>}</td>
    </tr>
  )
}
