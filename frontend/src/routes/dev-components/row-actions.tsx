import { useState } from "react";
import {
  BanIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  FilePlusIcon,
  LinkIcon,
  PaperclipIcon,
  StickyNoteIcon,
  TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePanel, useSpecimenOpen } from "./panel-context";
import { Sheet, Specimen } from "./panel";

function SampleRow({ action }: { action: React.ReactNode }) {
  return (
    <div className="flex h-11 w-[460px] items-center gap-4 rounded-md border border-border bg-card px-4 text-[13px]">
      <span className="w-12">Oct 19</span>
      <span className="flex-1 font-medium">Shell</span>
      <span className="text-muted-foreground">Travel &amp; transport</span>
      <span className="w-16 text-right font-medium tabular-nums">−$86.50</span>
      {action}
    </div>
  );
}

function RowActionsMenu() {
  const container = usePanel();
  const menu = useSpecimenOpen();
  const sub = useSpecimenOpen();
  const [category, setCategory] = useState("travel");
  return (
    <DropdownMenu modal={false} {...menu}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Row actions" />}>
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} align="end" className="w-[248px]">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <EyeIcon />
            View details
            <DropdownMenuShortcut>↵</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LinkIcon />
            Find a match
            <DropdownMenuShortcut>M</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub {...sub}>
            <DropdownMenuSubTrigger>
              <TagIcon />
              Change category
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent container={container} className="w-[220px]">
              <DropdownMenuRadioGroup value={category} onValueChange={setCategory}>
                <DropdownMenuRadioItem value="travel">Travel &amp; transport</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fuel">Fuel</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="meals">Meals</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="office">Office supplies</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>New category…</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <StickyNoteIcon />
            Add a note
            <DropdownMenuShortcut>N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PaperclipIcon />
            Attach a receipt
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CopyIcon />
            Copy transaction ID
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <BanIcon />
          Exclude from reconciliation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SUGGESTIONS = [
  { id: "[BILL-0000]", name: "[Vendor bill]", why: "Oct 19 · Same amount and date", amount: "$86.50", best: true },
  { id: "[BILL-0000]", name: "[Vendor bill]", why: "Oct 17 · Amount within $1", amount: "$86.00", best: false },
];

function FindMatchPopover() {
  const container = usePanel();
  const popover = useSpecimenOpen();
  return (
    <Popover {...popover}>
      <PopoverTrigger render={<Button variant="outline-primary" size="sm" />}>Find match</PopoverTrigger>
      <PopoverContent container={container} align="end" className="w-[340px]">
        <PopoverHeader>
          <PopoverTitle>Find a match</PopoverTitle>
          <PopoverDescription className="text-xs">
            Shell · Oct 19 · <span className="tabular-nums">−$86.50</span>
          </PopoverDescription>
        </PopoverHeader>
        <p className="px-2 pt-2 pb-1 text-xs/4 font-medium text-muted-foreground uppercase">Suggested</p>
        {SUGGESTIONS.map((s, i) => (
          <div key={i} className={cn("flex items-center gap-3 rounded-md px-2 py-2", s.best && "bg-accent")}>
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <span className="font-mono">{s.id}</span> · {s.name}
              </p>
              <p className="text-xs text-muted-foreground">{s.why}</p>
            </div>
            <span className="font-medium tabular-nums">{s.amount}</span>
            <Button size="sm" variant={s.best ? "default" : "outline"}>
              Match
            </Button>
          </div>
        ))}
        <Separator className="my-1" />
        <div className="flex items-center justify-between px-1 pb-0.5">
          <Button variant="ghost" size="sm">
            <FilePlusIcon data-icon="inline-start" />
            Create a bill
          </Button>
          <span className="pr-1 text-xs text-muted-foreground">2 of 2 suggestions</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RowActionsSheet() {
  return (
    <Sheet
      title="Row actions"
      note="components-row-actions.html. Out of scope until N21 (invoices); styled here so N21 can reuse them."
    >
      <Specimen title="Row actions" note="The ⋯ button appears on row hover and focus." height={340}>
        <SampleRow action={<RowActionsMenu />} />
      </Specimen>
      <Specimen title="Find a match" note="Anchored to the row. The best suggestion gets the primary button." height={280}>
        <SampleRow action={<FindMatchPopover />} />
      </Specimen>
    </Sheet>
  );
}
