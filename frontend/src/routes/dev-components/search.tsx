import { useState } from "react";
import {
  ArrowLeftRightIcon,
  CircleCheckIcon,
  FilePlusIcon,
  FileTextIcon,
  SearchIcon,
  SearchXIcon,
  StoreIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Sheet, Specimen } from "./panel";

function PaletteFrame({ children }: { children: React.ReactNode }) {
  // The palette's surface as it appears inside its Dialog (560 wide, popover surface).
  return (
    <div className="w-[560px] max-w-full overflow-hidden rounded-lg border border-border bg-popover shadow-popover">
      {children}
    </div>
  );
}

function PaletteFooter() {
  return (
    <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <KbdGroup>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </KbdGroup>
        Move
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>↵</Kbd>
        Open
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>esc</Kbd>
        Close
      </span>
    </div>
  );
}

function PaletteResults() {
  const [query, setQuery] = useState("acme");
  return (
    <PaletteFrame>
      <Command shouldFilter={false} label="Global search (sample)">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search transactions, invoices, vendors…" />
        <CommandList>
          <CommandGroup heading="Transactions">
            <CommandItem value="t1">
              <ArrowLeftRightIcon />
              <span className="flex-1 truncate">
                Acme Consulting <span className="text-muted-foreground">· Oct 20 · Chequing ••4821</span>
              </span>
              <span className="text-positive tabular-nums">+$4,500.00</span>
            </CommandItem>
            <CommandItem value="t2">
              <ArrowLeftRightIcon />
              <span className="flex-1 truncate">
                Acme Consulting <span className="text-muted-foreground">· Sep 18 · Chequing ••4821</span>
              </span>
              <span className="text-positive tabular-nums">+$4,500.00</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Invoices (N21)">
            <CommandItem value="i1">
              <FileTextIcon />
              <span className="flex-1 truncate">
                <span className="font-mono">INV-1048</span> · Acme Consulting
              </span>
              <span className="text-muted-foreground tabular-nums">Paid · $4,500.00</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Vendors (later)">
            <CommandItem value="v1">
              <StoreIcon />
              <span className="flex-1 truncate">Acme Consulting</span>
              <span className="text-muted-foreground">6 transactions · Client payment</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem value="a1">
              <FilePlusIcon />
              Create invoice for Acme Consulting
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <PaletteFooter />
      </Command>
    </PaletteFrame>
  );
}

function PaletteBeforeTyping() {
  return (
    <PaletteFrame>
      <Command label="Global search before typing (sample)">
        <CommandInput placeholder="Search transactions, invoices, vendors…" />
        <CommandList>
          <CommandGroup heading="Recent">
            <CommandItem>
              <StoreIcon />
              <span className="flex-1">Northstar Studio</span>
              <span className="text-xs text-muted-foreground">Vendor</span>
            </CommandItem>
            <CommandItem>
              <FileTextIcon />
              <span className="flex-1 font-mono">INV-1045</span>
              <span className="text-xs text-muted-foreground">Invoice</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Jump to">
            <CommandItem>
              <ArrowLeftRightIcon />
              Unmatched transactions
              <CommandShortcut>G U</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CircleCheckIcon />
              Reconciliation
              <CommandShortcut>G R</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <PaletteFooter />
      </Command>
    </PaletteFrame>
  );
}

function TableSearchEmpty() {
  return (
    <div className="w-[560px] max-w-full rounded-lg border border-border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>No transactions match “staples” in Oct 1–31</EmptyTitle>
          <EmptyDescription>Try a wider date range, or clear the search.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button variant="outline">Search all dates</Button>
          <Button variant="ghost">Clear search</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

/** A real CommandDialog, to check the dialog surface, focus trap and Esc (uses the page theme). */
export function PaletteDialogButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="lg" className="w-[220px] justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" />
        <span className="flex-1 text-left">Search AutoLedge</span>
        <Kbd>⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search AutoLedge" description="Search or jump to a page">
        <Command>
          <CommandInput placeholder="Search transactions, invoices, vendors…" />
          <CommandList>
            <CommandGroup heading="Jump to">
              <CommandItem onSelect={() => setOpen(false)}>
                <ArrowLeftRightIcon />
                Transactions
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <CircleCheckIcon />
                Reconciliation
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <PaletteFooter />
        </Command>
      </CommandDialog>
    </>
  );
}

export function SearchSheet() {
  return (
    <Sheet
      title="Search"
      note="components-search.html: ⌘K palette (results and before typing) and the table search empty state. Invoice and vendor groups are sample only (N21 / later)."
    >
      <Specimen title="Global search · results" note="Grouped by type; the first result is pre-selected.">
        <PaletteResults />
      </Specimen>
      <Specimen title="Global search · before typing">
        <PaletteBeforeTyping />
      </Specimen>
      <Specimen title="Table search · no results">
        <TableSearchEmpty />
      </Specimen>
    </Sheet>
  );
}
