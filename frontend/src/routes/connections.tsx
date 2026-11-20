import { Suspense, useEffect, useRef, useState } from 'react'
import { useFetcher, useParams } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Schemas } from '@/lib/api'
import { formatDate, formatDateTime, formatMask, formatMoney } from '@/lib/format'
import { businessQuery } from '@/queries/businesses'
import { accountsQuery, plaidItemsQuery } from '@/queries/plaid'
import PlaidLinkButton from '@/components/PlaidLinkButton'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { StatusBadge } from '@/components/LedgerControls'
import type { PlaidActionResult, PlaidIntent } from '@/routes/plaid-actions'
import '@/styles/connections.css'

type PlaidItem = Schemas['PlaidItemResponse']
type Account = Schemas['AccountResponse']

const NEEDS_ATTENTION_COPY: Record<string, string> = {
  ITEM_LOGIN_REQUIRED: 'The bank needs you to sign in again.',
  ITEM_LOCKED: 'The bank has locked this account. Unlock it with your bank.',
  USER_SETUP_REQUIRED: 'Finish setting up online banking with your bank.',
  INSUFFICIENT_CREDENTIALS: "The bank didn't grant access.",
  ACCESS_NOT_GRANTED: "The bank didn't grant access.",
  NO_ACCOUNTS: 'The bank reports no eligible accounts.',
}

function needsAttentionSentence(reason: string | null) {
  return (reason && NEEDS_ATTENTION_COPY[reason]) || 'This connection needs attention.'
}

function institutionName(item: PlaidItem) {
  return item.institution_name || 'Bank'
}

function submitJson(fetcher: ReturnType<typeof useFetcher>, payload: PlaidIntent) {
  return fetcher.submit(payload, { method: 'post', encType: 'application/json' })
}

// ── Route component ──

// The heading renders at once; the header action and the list suspend until the loader's
// prefetches resolve, with skeletons meanwhile (render-as-you-fetch, see connections-loaders.ts).
export default function Connections() {
  const businessId = useParams().businessId!

  return (
    <main className="ledger-page connections-page">
      <div className="ledger-header">
        <div className="ledger-intro">
          <h1>Connections</h1>
          <p>The bank accounts AutoLedge imports transactions from</p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-40" />}>
          <HeaderAction businessId={businessId} />
        </Suspense>
      </div>
      <Suspense fallback={<ConnectionsSkeleton />}>
        <ConnectionsList businessId={businessId} />
      </Suspense>
    </main>
  )
}

function ConnectButton({ businessId }: { businessId: string }) {
  return (
    <PlaidLinkButton
      key={businessId}
      businessId={businessId}
      actionPath={`/b/${businessId}/connections`}
      className="ledger-header-action connections-connect"
    />
  )
}

function HeaderAction({ businessId }: { businessId: string }) {
  const { data: business } = useSuspenseQuery(businessQuery(businessId))
  const { data: items } = useSuspenseQuery(plaidItemsQuery(businessId))
  if (business.role !== 'owner') return <p className="connections-note">Only owners can connect or remove banks.</p>
  return items.length > 0 ? <ConnectButton businessId={businessId} /> : null
}

/** Two placeholder cards shaped like a connection (name + status, meta line, account rows). */
function ConnectionsSkeleton() {
  return (
    <div className="connections-list" aria-busy="true" aria-label="Loading connections">
      {[0, 1].map((i) => (
        <div key={i} className="ledger-card flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-3.5 w-64" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
      ))}
    </div>
  )
}

function ConnectionsList({ businessId }: { businessId: string }) {
  const { data: business } = useSuspenseQuery(businessQuery(businessId))
  const { data: items } = useSuspenseQuery(plaidItemsQuery(businessId))
  const { data: accounts } = useSuspenseQuery(accountsQuery(businessId))

  const isOwner = business.role === 'owner'
  const disconnected = accounts.filter((account) => !account.connected)
  const connectButton = <ConnectButton businessId={businessId} />

  return (
    <>
      {items.length === 0 ? (
        <section className="ledger-card connections-empty">
          <h2>No banks connected yet.</h2>
          {isOwner ? connectButton : <p>Ask an owner to connect a bank.</p>}
        </section>
      ) : (
        <ul className="connections-list">
          {items.map((item) => (
            <li key={item.id}>
              <ConnectionCard item={item} isOwner={isOwner} />
            </li>
          ))}
        </ul>
      )}

      {disconnected.length > 0 && <DisconnectedAccounts accounts={disconnected} />}
    </>
  )
}

// ── One connection ──

function ConnectionCard({ item, isOwner }: { item: PlaidItem; isOwner: boolean }) {
  const refresh = useFetcher<PlaidActionResult>()
  const syncing = refresh.state !== 'idle'
  const result = !syncing ? refresh.data : undefined
  const name = institutionName(item)
  const headingId = `connection-${item.id}`

  // A finished refresh is announced as a toast (errors stay inline below). The ref keeps one
  // result from being announced twice (StrictMode, re-renders).
  const announced = useRef<PlaidActionResult | undefined>(undefined)
  useEffect(() => {
    if (!result?.ok || result.intent !== 'refresh' || announced.current === result) return
    announced.current = result
    const upToDate = result.added === 0 && result.modified === 0 && result.removed === 0
    toast.add({
      type: 'success',
      title: upToDate
        ? `${name} is up to date`
        : `${name} synced: ${result.added} new, ${result.modified} updated, ${result.removed} removed`,
    })
  }, [result, name])

  return (
    <article className="ledger-card connection-card" aria-labelledby={headingId}>
      <header className="connection-header">
        <div className="connection-title">
          <h2 id={headingId}>{name}</h2>
          <ConnectionStatus item={item} syncing={syncing} />
        </div>
        <div className="connection-actions">
          <button
            type="button"
            className="ledger-header-action"
            disabled={syncing}
            onClick={() => submitJson(refresh, { intent: 'refresh', item_id: item.id })}
          >
            {syncing ? 'Syncing…' : 'Refresh'}
          </button>
          {isOwner && <RemoveConnection item={item} />}
        </div>
      </header>

      <div className="connection-meta">
        <p>
          Last synced: {item.last_synced_at ? formatDateTime(item.last_synced_at) : 'Not synced yet'}
        </p>
        {item.status === 'needs_attention' && !syncing && (
          <p className="connection-attention">
            {needsAttentionSentence(item.needs_update_reason)} Reconnecting isn't available yet. Refresh to check again.
          </p>
        )}
        {!item.history_complete && (
          <p className="connection-quiet">Plaid may still be importing older transactions. Refresh in a little while.</p>
        )}
      </div>

      <AccountsTable accounts={item.accounts} caption={`${name} accounts`} />

      {result && !result.ok && (
        <p className="connection-error" role="alert">
          {result.error}
        </p>
      )}
    </article>
  )
}

function ConnectionStatus({ item, syncing }: { item: PlaidItem; syncing: boolean }) {
  if (syncing) return <StatusBadge tone="neutral">Syncing…</StatusBadge>
  if (item.status === 'needs_attention') return <StatusBadge tone="warning">Needs attention</StatusBadge>
  return <StatusBadge tone="positive">OK</StatusBadge>
}

function AccountsTable({ accounts, caption }: { accounts: Account[]; caption: string }) {
  if (accounts.length === 0) return <p className="connection-quiet connection-no-accounts">No accounts.</p>
  return (
    <div className="ledger-table-scroll">
      <table className="ledger-table connection-accounts">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Type</th>
            <th scope="col" className="align-right">
              Current balance
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                <span className="ledger-strong">{account.name}</span>
                {account.mask && <span className="ledger-caption">{formatMask(account.mask)}</span>}
              </td>
              <td className="ledger-item connection-type">{account.type}</td>
              <td className="ledger-item ledger-amount align-right">
                {account.current_balance === null ? '—' : formatMoney(account.current_balance, account.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Remove (owner) ──

function RemoveConnection({ item }: { item: PlaidItem }) {
  const dialog = useRef<HTMLDialogElement>(null)
  // Remounts the dialog body on every open, so an old error doesn't linger.
  const [openCount, setOpenCount] = useState(0)

  return (
    <>
      <button
        type="button"
        className="ledger-header-action connection-remove"
        onClick={() => {
          setOpenCount((count) => count + 1)
          dialog.current?.showModal()
        }}
      >
        Remove
      </button>
      <dialog ref={dialog} className="connection-dialog" aria-labelledby={`remove-${item.id}`}>
        <RemoveDialogBody key={openCount} item={item} close={() => dialog.current?.close()} />
      </dialog>
    </>
  )
}

function RemoveDialogBody({ item, close }: { item: PlaidItem; close: () => void }) {
  const remove = useFetcher<PlaidActionResult>()
  const removing = remove.state !== 'idle'
  const result = !removing ? remove.data : undefined

  useEffect(() => {
    if (result?.ok) close()
  }, [result, close])

  return (
    <>
      <h2 id={`remove-${item.id}`}>Remove {institutionName(item)}?</h2>
      <p>
        AutoLedge will stop syncing this bank and revoke its access at Plaid. Its accounts and transactions stay in
        AutoLedge.
      </p>
      {result && !result.ok && (
        <p className="connection-error" role="alert">
          {result.error}
        </p>
      )}
      <div className="connection-dialog-actions">
        <button type="button" className="ledger-header-action" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className="ledger-header-action connection-remove-confirm"
          disabled={removing}
          onClick={() => submitJson(remove, { intent: 'remove', item_id: item.id })}
        >
          {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </>
  )
}

// ── Disconnected accounts ──

function DisconnectedAccounts({ accounts }: { accounts: Account[] }) {
  return (
    <section className="ledger-card connection-card" aria-labelledby="disconnected-heading">
      <header className="connection-header">
        <div className="connection-title">
          <h2 id="disconnected-heading">Disconnected accounts</h2>
        </div>
      </header>
      <p className="connection-meta connection-quiet">Their transactions are kept.</p>
      <ul className="disconnected-list">
        {accounts.map((account) => (
          <li key={account.id}>
            <span className="ledger-strong">{account.name}</span>
            {account.mask && <span className="ledger-caption">{formatMask(account.mask)}</span>}
            <span className="disconnected-status">
              <StatusBadge tone="neutral">Disconnected</StatusBadge>
              {account.inactive_since && <span>since {formatDate(new Date(account.inactive_since))}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
