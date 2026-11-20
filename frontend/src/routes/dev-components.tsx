// Development-only page (registered in router.tsx only when import.meta.env.DEV).
// Recreates the component sheets in design/artboards/components-*.html with SAMPLE content,
// light and dark side by side, to compare the styled shadcn components against the design.
import { useState } from "react";
import { DownloadIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, Specimen } from "./dev-components/panel";
import { MenusSheet } from "./dev-components/menus";
import { PaletteDialogButton, SearchSheet } from "./dev-components/search";
import { FiltersSheet } from "./dev-components/filters";
import { RowActionsSheet } from "./dev-components/row-actions";
import { FeedbackSheet } from "./dev-components/feedback";
import { PendingSheet } from "./dev-components/pending";

function PrimitivesSheet() {
  const [tab, setTab] = useState("all");
  const [segment, setSegment] = useState(["any"]);
  return (
    <Sheet title="Primitives" note="SPEC.md → Foundations: buttons, chips, tabs, inputs, kbd.">
      <Specimen title="Buttons" note="sm 28 · default 32 · lg 36 · icon 32 · icon-lg 44">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="outline-primary">Find match</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="Download">
              <DownloadIcon />
            </Button>
            <Button size="icon-lg" variant="outline" aria-label="Download (touch)">
              <DownloadIcon />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Specimen>
      <Specimen title="Chips and badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">INV-1048</Badge>
          <Badge variant="negative-tint">Unmatched</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge>Default</Badge>
        </div>
      </Specimen>
      <Specimen title="Status tabs" note="Selected = solid primary. Counts only when the API provides them.">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="posted">Posted</TabsTrigger>
          </TabsList>
        </Tabs>
      </Specimen>
      <Specimen title="Toggle group">
        <ToggleGroup value={segment} onValueChange={(v) => v.length && setSegment(v)} aria-label="Direction">
          <ToggleGroupItem value="any">Any</ToggleGroupItem>
          <ToggleGroupItem value="in">Money in</ToggleGroupItem>
          <ToggleGroupItem value="out">Money out</ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
      <Specimen title="Inputs" note="Table search: 280 × 32, search icon inside.">
        <div className="flex flex-col gap-2">
          <InputGroup className="w-[280px]">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search transactions" />
          </InputGroup>
          <Input className="w-[280px]" placeholder="Plain input" />
        </div>
      </Specimen>
      <Specimen title="Kbd and skeleton">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Kbd>⌘K</Kbd> <Kbd>Ctrl K</Kbd> <Kbd>esc</Kbd>
          </span>
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </Specimen>
    </Sheet>
  );
}

export default function DevComponents() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-8 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-normal">Components</h1>
              <Badge variant="negative-tint">Sample content · development only</Badge>
            </div>
            <p className="max-w-[720px] text-[13px] text-muted-foreground">
              The styled shadcn components with sample data from the design sheets, light and dark side by side. Nothing
              here is real data. Compare against <code className="font-mono">frontend/design/artboards/components-*.html</code>;
              where the sheets predate the accent pass, <code className="font-mono">SPEC.md</code> wins.
            </p>
          </div>
          <PaletteDialogButton />
        </header>
        <PrimitivesSheet />
        <MenusSheet />
        <SearchSheet />
        <FiltersSheet />
        <RowActionsSheet />
        <FeedbackSheet />
        <PendingSheet />
      </div>
    </main>
  );
}
