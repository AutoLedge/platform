import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { Schemas } from "@/lib/api";
import { DATE_PRESETS, formatRange, matchPreset, toISODate } from "@/lib/date-ranges";
import { formatAccount, parseLocalDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionFilters } from "@/queries/transactions";
import { useFilterUrl } from "./filter-url";

type Account = Schemas["AccountResponse"];

// Tablet (768–1023): 40-tall filter buttons, 44-tall search (touch).
const filterButtonClass = "h-9 shrink-0 gap-2 md:max-lg:h-10";

/** SPEC → Filter button: label in muted-foreground, value in foreground, chevron 14. */
function FilterButtonContent({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[220px] truncate">{value}</span>
      <ChevronDownIcon data-icon="inline-end" className="size-3.5 text-muted-foreground" />
    </>
  );
}

// ── Table search → q ──

export function TableSearch({ q }: { q: string | undefined }) {
  const { apply } = useFilterUrl();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    apply({ q: typeof value === "string" ? value : undefined });
  }
  return (
    // Keyed by q so Back/Forward refill the field.
    <form key={q ?? ""} role="search" onSubmit={handleSubmit} className="shrink-0">
      <InputGroup className="w-[280px] md:max-lg:h-11">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          maxLength={100}
          placeholder="Search transactions"
          aria-label="Search transactions"
          defaultValue={q ?? ""}
        />
      </InputGroup>
    </form>
  );
}

// ── Date → from / to ──

export function DateFilter({ from, to }: { from: string | undefined; to: string | undefined }) {
  const { apply } = useFilterUrl();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [range, setRange] = useState<DayPickerRange | undefined>();
  const today = new Date();
  const active = matchPreset(from, to, today);
  const anyTime = !from && !to;

  function choose(next: { from?: string; to?: string }) {
    apply({ from: next.from, to: next.to });
    setOpen(false);
  }

  function openChange(next: boolean) {
    setOpen(next);
    if (next) {
      setCustom(false);
      setRange(from || to ? { from: from ? parseLocalDate(from) : undefined, to: to ? parseLocalDate(to) : undefined } : undefined);
    }
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger render={<Button variant="outline" size="lg" className={filterButtonClass} />}>
        <FilterButtonContent label="Date" value={formatRange(from, to)} />
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(custom ? "w-auto" : "w-[240px]")}>
        {custom ? (
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={range?.from ?? new Date(today.getFullYear(), today.getMonth() - 1, 1)}
              selected={range}
              onSelect={setRange}
            />
            <div className="flex justify-end gap-2 border-t border-border p-2">
              <Button variant="ghost" size="sm" onClick={() => setCustom(false)}>
                Back
              </Button>
              <Button
                size="sm"
                disabled={!range?.from}
                onClick={() =>
                  range?.from && choose({ from: toISODate(range.from), to: toISODate(range.to ?? range.from) })
                }
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <>
            <PresetButton label="Any time" selected={anyTime} onClick={() => choose({})} />
            {DATE_PRESETS.map((preset) => {
              const r = preset.range(today);
              const selected = active?.id === preset.id;
              return (
                <PresetButton
                  key={preset.id}
                  label={preset.label}
                  detail={selected ? formatRange(r.from, r.to) : undefined}
                  selected={selected}
                  onClick={() => choose(r)}
                />
              );
            })}
            <Separator className="my-1" />
            <PresetButton
              label="Custom range…"
              detail={!anyTime && !active ? formatRange(from, to) : undefined}
              selected={!anyTime && !active}
              onClick={() => setCustom(true)}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PresetButton({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="h-auto min-h-8 justify-between gap-2 px-2 py-1.5 font-normal"
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="flex items-center gap-2.5">
        <CheckIcon className={cn("text-primary", !selected && "invisible")} />
        {label}
      </span>
      {detail && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
    </Button>
  );
}

// ── Accounts → account_id ──

export function AccountsFilter({ accounts, accountId }: { accounts: Account[]; accountId: string | undefined }) {
  const { apply } = useFilterUrl();
  const current = accounts.find((a) => a.id === accountId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="lg" className={filterButtonClass} />}>
        <FilterButtonContent
          label="Accounts"
          value={current ? formatAccount(current.name, current.mask) : "All accounts"}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[272px]">
        <DropdownMenuRadioGroup value={accountId ?? ""} onValueChange={(value: string) => apply({ account_id: value })}>
          <DropdownMenuRadioItem value="">All accounts</DropdownMenuRadioItem>
          {accounts.length > 0 && <DropdownMenuSeparator />}
          {accounts.map((account) => (
            <DropdownMenuRadioItem key={account.id} value={account.id}>
              <span className="truncate">
                {account.name}
                {account.mask && <span className="font-mono text-muted-foreground"> ••{account.mask}</span>}
                {!account.connected && <span className="text-muted-foreground"> (disconnected)</span>}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Status tabs → pending ──

const STATUS_TABS: { label: string; value: TransactionFilters["pending"] }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "true" },
  { label: "Posted", value: "false" },
];

/** Links, not tabs: each keeps the other filters and works with back/forward and shared links. */
export function StatusTabs({ pending }: { pending: TransactionFilters["pending"] }) {
  const { href } = useFilterUrl();
  return (
    <nav aria-label="Status" className="flex items-center gap-1">
      {STATUS_TABS.map((tab) => {
        const selected = tab.value === pending;
        return (
          <Button
            key={tab.label}
            variant="ghost"
            className={cn(
              "px-3 text-muted-foreground",
              selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            render={<Link to={href({ pending: tab.value })} aria-current={selected ? "page" : undefined} />}
            nativeButton={false}
          >
            {tab.label}
          </Button>
        );
      })}
    </nav>
  );
}

/** Filter row: search, Date, spacer, Accounts. One horizontally scrolling row on tablet. */
export function FilterRow({ filters, accounts }: { filters: TransactionFilters; accounts: Account[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:max-lg:-mx-1 md:max-lg:flex-nowrap md:max-lg:overflow-x-auto md:max-lg:px-1 md:max-lg:py-1">
      <TableSearch q={filters.q} />
      <DateFilter from={filters.from} to={filters.to} />
      <span className="flex-1" />
      <AccountsFilter accounts={accounts} accountId={filters.account_id} />
    </div>
  );
}
