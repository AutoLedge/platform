import { useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, LinkIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePanel, useSpecimenOpen } from "./panel-context";
import { Sheet, Specimen } from "./panel";

/** SPEC → Filter button: 36 tall, label muted + value + chevron 14. */
function FilterButtonLabel({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
      <ChevronDownIcon data-icon="inline-end" className="size-3.5 text-muted-foreground" />
    </>
  );
}

const PRESETS = [
  { label: "Today", dates: "Oct 21" },
  { label: "Last 7 days", dates: "Oct 15–21" },
  { label: "This month", dates: "Oct 1–31, 2026" },
  { label: "Last month", dates: "Sep 1–30, 2026" },
  { label: "This quarter", dates: "Oct 1 – Dec 31" },
  { label: "Year to date", dates: "Jan 1 – Oct 21" },
];

function DateFilter() {
  const container = usePanel();
  const popover = useSpecimenOpen();
  const [preset, setPreset] = useState("This month");
  return (
    <Popover {...popover}>
      <PopoverTrigger render={<Button variant="outline" size="lg" />}>
        <FilterButtonLabel label="Date" value="Oct 1–31, 2026" />
      </PopoverTrigger>
      <PopoverContent container={container} align="start" className="w-[240px]">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="ghost"
            className="h-auto min-h-8 justify-between px-2 py-1.5 font-normal"
            aria-pressed={preset === p.label}
            onClick={() => setPreset(p.label)}
          >
            <span className="flex items-center gap-2.5">
              <CheckIcon className={preset === p.label ? "text-primary" : "invisible"} />
              {p.label}
            </span>
            {preset === p.label && <span className="text-xs text-muted-foreground">{p.dates}</span>}
          </Button>
        ))}
        <Separator className="my-1" />
        <Button variant="ghost" className="justify-start px-2 font-normal">
          <span className="w-4" />
          Custom range…
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function CustomRange() {
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 21) });
  return (
    <div className="w-fit rounded-lg border border-border bg-popover p-1 shadow-popover">
      <Calendar mode="range" numberOfMonths={2} defaultMonth={new Date(2026, 8, 1)} selected={range} onSelect={setRange} />
      <div className="flex justify-end gap-2 border-t border-border p-2">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Apply</Button>
      </div>
    </div>
  );
}

const CATEGORIES = ["Client payment", "Software & subscriptions", "Travel & transport", "Office supplies", "Utilities"];

function CategoryFilter() {
  const container = usePanel();
  const menu = useSpecimenOpen();
  const [checked, setChecked] = useState<string[]>(["Software & subscriptions", "Travel & transport"]);
  const toggle = (c: string, on: boolean) => setChecked((prev) => (on ? [...prev, c] : prev.filter((x) => x !== c)));
  return (
    <DropdownMenu modal={false} {...menu}>
      <DropdownMenuTrigger render={<Button variant="outline" size="lg" />}>
        <FilterButtonLabel label="Category" value={`${checked.length} selected`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} className="w-[260px]">
        <DropdownMenuGroup>
          {CATEGORIES.map((c) => (
            <DropdownMenuCheckboxItem
              key={c}
              checked={checked.includes(c)}
              onCheckedChange={(on) => toggle(c, on)}
              closeOnClick={false}
            >
              {c}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex justify-end gap-2 p-1">
          <Button variant="ghost" size="sm" onClick={() => setChecked([])}>
            Clear
          </Button>
          <Button size="sm">Apply · {checked.length}</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AmountFilter() {
  const container = usePanel();
  const popover = useSpecimenOpen();
  const [direction, setDirection] = useState(["any"]);
  return (
    <Popover {...popover}>
      <PopoverTrigger render={<Button variant="outline" size="lg" />}>
        <FilterButtonLabel label="Amount" value="Over $100" />
      </PopoverTrigger>
      <PopoverContent container={container} align="start" className="w-[260px] gap-3 p-3">
        <ToggleGroup
          value={direction}
          onValueChange={(v) => v.length && setDirection(v)}
          spacing={0}
          variant="outline"
          className="w-full *:flex-1"
          aria-label="Direction"
        >
          <ToggleGroupItem value="any">Any</ToggleGroupItem>
          <ToggleGroupItem value="in">Money in</ToggleGroupItem>
          <ToggleGroupItem value="out">Money out</ToggleGroupItem>
        </ToggleGroup>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Minimum", "100.00"],
            ["Maximum", ""],
          ].map(([label, value]) => (
            <label key={label} className="flex flex-col gap-1 text-xs text-muted-foreground">
              {label}
              <InputGroup>
                <InputGroupAddon>$</InputGroupAddon>
                <InputGroupInput defaultValue={value} placeholder="0.00" className="font-mono tabular-nums" inputMode="decimal" />
              </InputGroup>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm">
            Clear
          </Button>
          <Button size="sm">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AccountsFilter() {
  const container = usePanel();
  const menu = useSpecimenOpen();
  const [account, setAccount] = useState("all");
  return (
    <DropdownMenu modal={false} {...menu}>
      <DropdownMenuTrigger render={<Button variant="outline" size="lg" />}>
        <FilterButtonLabel label="Accounts" value="All accounts" />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} align="end" className="w-[272px]">
        <DropdownMenuRadioGroup value={account} onValueChange={setAccount}>
          <DropdownMenuRadioItem value="all">
            <span className="flex flex-col">
              All accounts
              <span className="text-xs text-muted-foreground">Combined view</span>
            </span>
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Linked accounts</DropdownMenuLabel>
          <DropdownMenuRadioItem value="chq">
            <span className="flex flex-col">
              <span>
                Chequing <span className="font-mono text-muted-foreground">••4821</span>
              </span>
              <span className="text-xs text-muted-foreground">[Bank]</span>
            </span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="other">
            <span className="flex flex-col">
              <span>
                [Account name] <span className="font-mono text-muted-foreground">••0000</span>
              </span>
              <span className="text-xs text-muted-foreground">[Bank] (disconnected)</span>
            </span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LinkIcon />
          Link an account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FiltersSheet() {
  return (
    <Sheet
      title="Filters"
      note="components-filters.html. Date and Accounts are wired in N22.4; Category and Amount wait for API support."
    >
      <Specimen title="Date" note="Presets first; the active one shows its real dates." height={330}>
        <DateFilter />
      </Specimen>
      <Specimen title="Category (multi-select)" note="Applies on Apply, not on each click." height={300}>
        <CategoryFilter />
      </Specimen>
      <Specimen title="Amount" note="Direction plus an optional range." height={240}>
        <AmountFilter />
      </Specimen>
      <Specimen title="Accounts" note="All accounts is the default." height={300}>
        <div className="flex w-[272px] justify-end">
          <AccountsFilter />
        </div>
      </Specimen>
      <Specimen title="Custom range" note="Two-month calendar.">
        <CustomRange />
      </Specimen>
    </Sheet>
  );
}
