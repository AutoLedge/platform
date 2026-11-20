import { Suspense } from "react";
import { Link, useLoaderData, useLocation, useNavigation, useParams } from "react-router";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { ClockIcon, LinkIcon, SearchXIcon, ArrowLeftRightIcon } from "lucide-react";
import { FilterRow, StatusTabs } from "@/components/transactions/transaction-filters";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Schemas } from "@/lib/api";
import { formatAccount, formatMoney, formatShortDate, parseLocalDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { transactionsQuery, type TransactionFilters } from "@/queries/transactions";
import type { transactionsLoader } from "@/routes/transactions-loaders";

type Transaction = Schemas["TransactionResponse"];

// Plaid's primary categories. The API sends the detailed one (e.g. FOOD_AND_DRINK_COFFEE),
// whose prefix is one of these.
const PRIMARY_CATEGORIES = [
  "INCOME", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS", "LOAN_DISBURSEMENTS", "BANK_FEES",
  "ENTERTAINMENT", "FOOD_AND_DRINK", "GENERAL_MERCHANDISE", "HOME_IMPROVEMENT", "MEDICAL",
  "PERSONAL_CARE", "GENERAL_SERVICES", "GOVERNMENT_AND_NON_PROFIT", "TRANSPORTATION", "TRAVEL",
  "RENT_AND_UTILITIES",
];

function sentenceCase(code: string) {
  const words = code.toLowerCase().replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "FOOD_AND_DRINK_COFFEE" → "Food and drink · Coffee". */
function formatCategory(category: string | null) {
  if (!category) return "—";
  const primary = PRIMARY_CATEGORIES.find((prefix) => category.startsWith(`${prefix}_`));
  if (!primary) return sentenceCase(category);
  return `${sentenceCase(primary)} · ${sentenceCase(category.slice(primary.length + 1))}`;
}

// ── Route component ──

export default function Transactions() {
  const businessId = useParams().businessId!;
  const { filters, invalidRange } = useLoaderData<typeof transactionsLoader>();

  return (
    // SPEC.md → Transactions page: no visible title (the breadcrumb names the page).
    // The frame renders at once; the accounts picker and the table suspend on their own data.
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-8 pt-6 pb-10 max-md:px-4">
      <h1 className="sr-only">Transactions</h1>
      <FilterRow filters={filters} businessId={businessId} />
      {invalidRange ? (
        <TableCard pending={filters.pending}>
          <p role="alert" className="px-4 py-10 text-center text-[13px] text-destructive">
            'From' must be on or before 'To'.
          </p>
        </TableCard>
      ) : (
        <Suspense
          fallback={
            <TableCard pending={filters.pending}>
              <TableSkeleton />
            </TableCard>
          }
        >
          <TransactionTable businessId={businessId} filters={filters} />
        </Suspense>
      )}
    </main>
  );
}

/** Same columns and row height as the table, so nothing jumps when the rows arrive. */
function TableSkeleton() {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-1/2", "w-2/3", "w-3/4"];
  return (
    <div aria-busy="true" aria-label="Loading transactions">
      <Table className="min-w-[760px] table-fixed md:min-w-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[132px]">Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="w-[200px] md:max-lg:hidden">Account</TableHead>
            <TableHead className="w-[220px] md:max-lg:hidden">Category</TableHead>
            <TableHead className="w-[140px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {widths.map((width, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <Skeleton className="h-3.5 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className={cn("h-3.5", width)} />
              </TableCell>
              <TableCell className="md:max-lg:hidden">
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell className="md:max-lg:hidden">
                <Skeleton className="h-3.5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3.5 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex h-[53px] items-center border-t border-border px-4">
        <Skeleton className="h-3.5 w-40" />
      </div>
    </div>
  );
}

function TableCard({
  pending,
  aside,
  children,
}: {
  pending: TransactionFilters["pending"];
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label="Bank transactions" className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-2">
        <StatusTabs pending={pending} />
        <span className="flex-1" />
        {aside}
      </div>
      {children}
    </section>
  );
}

// ── Results ──

function TransactionTable({ businessId, filters }: { businessId: string; filters: TransactionFilters }) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } = useSuspenseInfiniteQuery(
    transactionsQuery(businessId, filters),
  );
  const rows = data.pages.flatMap((page) => page.items);
  const filtered = Object.keys(filters).length > 0;

  // Changing a filter keeps these rows on screen (React holds visible content during a router
  // transition) until the new ones arrive; dim them meanwhile.
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const updating = navigation.state !== "idle" && navigation.location?.pathname === pathname;
  const allCad = rows.length > 0 && rows.every((row) => row.currency === "CAD");

  // "All" tab: loaded pending rows first under PENDING, the rest under CLEARED (SPEC → Pending).
  const pendingRows = filters.pending === undefined ? rows.filter((row) => row.pending) : [];
  const grouped = pendingRows.length > 0;
  const clearedRows = grouped ? rows.filter((row) => !row.pending) : rows;

  const pagePath = `/b/${businessId}/transactions`;

  return (
    <TableCard
      pending={filters.pending}
      aside={allCad && <span className="pr-2 text-xs text-muted-foreground">All amounts in CAD</span>}
    >
      <div aria-busy={updating} className={cn("transition-opacity", updating && "opacity-60")}>
      {rows.length === 0 ? (
        filtered ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>No transactions match these filters</EmptyTitle>
              <EmptyDescription>Try a wider date range or another account, or clear the filters.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<Link to={pagePath} />} nativeButton={false}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ArrowLeftRightIcon />
              </EmptyMedia>
              <EmptyTitle>No transactions yet</EmptyTitle>
              <EmptyDescription>Connect a bank account and its transactions show up here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link to={`/b/${businessId}/connections`} />} nativeButton={false}>
                <LinkIcon data-icon="inline-start" />
                Go to Connections
              </Button>
            </EmptyContent>
          </Empty>
        )
      ) : (
        <Table className="min-w-[760px] table-fixed md:min-w-0">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[132px]">Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="w-[200px] md:max-lg:hidden">Account</TableHead>
              <TableHead className="w-[220px] md:max-lg:hidden">Category</TableHead>
              <TableHead className="w-[140px] text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped && <GroupHeader>{`Pending · ${pendingRows.length}`}</GroupHeader>}
            {pendingRows.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {grouped && clearedRows.length > 0 && <GroupHeader>Cleared</GroupHeader>}
            {clearedRows.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5">
        <p className="text-[13px] text-muted-foreground">
          Showing {rows.length} {rows.length === 1 ? "transaction" : "transactions"}
        </p>
        <div className="flex items-center gap-3">
          {isFetchNextPageError && !isFetchingNextPage && (
            <span role="alert" className="text-[13px] text-destructive">
              Couldn't load more transactions.
            </span>
          )}
          {hasNextPage && (
            <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      </div>
      </div>
    </TableCard>
  );
}

function GroupHeader({ children }: { children: string }) {
  return (
    <TableRow className="hover:bg-background">
      <TableCell colSpan={5} className="h-auto bg-background py-1.5 text-xs/4 font-medium text-muted-foreground uppercase">
        {children}
      </TableCell>
    </TableRow>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  // Plaid's sign: positive is money out of the account, negative is money in.
  const outflow = !transaction.amount.startsWith("-");
  const amount = formatMoney(transaction.amount, transaction.currency, { unsigned: true });
  const category = formatCategory(transaction.category);
  const pending = transaction.pending;

  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2">
          {formatShortDate(parseLocalDate(transaction.date))}
          {pending && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-[13px]" aria-hidden="true" />
              Pending
            </span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <span className="block truncate font-medium">{transaction.merchant_name || transaction.description}</span>
        {transaction.merchant_name && (
          <span className="block truncate text-xs text-muted-foreground">{transaction.description}</span>
        )}
        {/* Tablet: the Category column is hidden, so the category moves under the vendor. */}
        <span className="hidden truncate text-xs text-muted-foreground md:max-lg:block">{category}</span>
      </TableCell>
      <TableCell className="md:max-lg:hidden">
        <span className="block truncate">{formatAccount(transaction.account_name, transaction.account_mask)}</span>
      </TableCell>
      <TableCell className="md:max-lg:hidden">
        <span className="block truncate">{category}</span>
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          pending ? "text-muted-foreground" : outflow ? "text-foreground" : "text-positive",
        )}
      >
        <span className="sr-only">{outflow ? "Money out" : "Money in"} </span>
        {outflow ? "−" : "+"}
        {amount}
      </TableCell>
    </TableRow>
  );
}
