import { CheckIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Sheet, Specimen } from "./panel";

type Row = {
  date: string;
  time?: string;
  vendor: string;
  category: string;
  amount: string;
  moneyIn: boolean;
  status: "pending" | "matched" | "unmatched";
  invoice?: string;
};

const PENDING: Row[] = [
  { date: "Oct 21", vendor: "Air Canada", category: "Travel & transport", amount: "−$412.60", moneyIn: false, status: "pending" },
  { date: "Oct 21", vendor: "Northstar Studio", category: "Client payment", amount: "+$1,200.00", moneyIn: true, status: "pending" },
];
const CLEARED: Row[] = [
  { date: "Oct 20", time: "10:42", vendor: "Acme Consulting", category: "Client payment", amount: "+$4,500.00", moneyIn: true, status: "matched", invoice: "INV-1048" },
  { date: "Oct 20", time: "09:15", vendor: "Adobe", category: "Software & subscriptions", amount: "−$79.99", moneyIn: false, status: "matched", invoice: "INV-1047" },
  { date: "Oct 19", time: "16:38", vendor: "Shell", category: "Travel & transport", amount: "−$86.50", moneyIn: false, status: "unmatched" },
];

/** SPEC → Invoice-ID chip / Unmatched: 16px status slot, then the chip. */
function StatusCell({ row }: { row: Row }) {
  if (row.status === "pending") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClockIcon className="size-3.5" />
        Matches when cleared
      </span>
    );
  }
  if (row.status === "matched") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="flex size-4 items-center justify-center">
          <CheckIcon className="size-4 text-positive" strokeWidth={2} />
        </span>
        <Badge variant="brand">{row.invoice}</Badge>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex size-4 items-center justify-center" aria-hidden>
        <span className="size-2 rounded-full border-[1.5px] border-destructive" />
      </span>
      <Badge variant="negative-tint">Unmatched</Badge>
      <Button variant="outline-primary" size="sm" className="ml-1">
        Find match
      </Button>
    </span>
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

function TxRow({ row }: { row: Row }) {
  const pending = row.status === "pending";
  return (
    <TableRow aria-label={pending ? `${row.vendor}, pending` : undefined}>
      <TableCell>
        <span className="flex items-center gap-2">
          {row.date}
          {pending ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-[13px]" />
              Pending
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">{row.time}</span>
          )}
        </span>
      </TableCell>
      <TableCell className="font-medium">{row.vendor}</TableCell>
      <TableCell className="text-muted-foreground">{row.category}</TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          pending ? "text-muted-foreground" : row.moneyIn ? "text-positive" : "text-foreground",
        )}
      >
        {row.amount}
      </TableCell>
      <TableCell>
        <StatusCell row={row} />
      </TableCell>
    </TableRow>
  );
}

export function PendingSheet() {
  return (
    <Sheet
      title="Table, chips and pending"
      note="desktop-light.html status slot and chips, and pending-options.html option 05 (combined). The invoice column is N21."
    >
      <Specimen title="Pending · combined treatment">
        <div className="w-[640px] max-w-full overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <GroupHeader>{`Pending · ${PENDING.length}`}</GroupHeader>
              {PENDING.map((r) => (
                <TxRow key={r.vendor} row={r} />
              ))}
              <GroupHeader>Cleared</GroupHeader>
              {CLEARED.map((r) => (
                <TxRow key={r.vendor} row={r} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Specimen>
    </Sheet>
  );
}
