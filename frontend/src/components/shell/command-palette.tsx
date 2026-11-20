import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Building2Icon, SearchIcon } from "lucide-react";
import { Command, CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { businessPath, mainRoutes, setupRoutes } from "./nav-routes";

/**
 * Ctrl/⌘ K palette (SPEC.md → Command palette). Only what the API supports today:
 * jump to a page, or search transactions. Invoice and vendor results wait for their APIs.
 */
export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const [query, setQuery] = useState("");
  const text = query.trim().slice(0, 100);

  // Every close goes through here, so the next open (shortcut, button) starts empty.
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) setQuery("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  // Ctrl/⌘ K toggles the palette from anywhere in the shell.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search AutoLedge"
      description="Jump to a page or search transactions"
    >
      <Command>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={businessId ? "Search transactions or jump to a page…" : "Jump to…"}
        />
        <CommandList>
          {businessId && text && (
            <CommandGroup heading="Transactions">
              {/* forceMount: cmdk's filter must never hide the search action. */}
              <CommandItem
                forceMount
                value={`search-transactions ${text}`}
                onSelect={() => go(`${businessPath(businessId, "transactions")}?${new URLSearchParams({ q: text })}`)}
              >
                <SearchIcon />
                <span className="truncate">
                  Search transactions for <span className="font-medium">“{text}”</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}
          {businessId ? (
            <CommandGroup heading="Jump to">
              {[...mainRoutes, ...setupRoutes].map((route) => (
                <CommandItem key={route.label} value={route.label} onSelect={() => go(businessPath(businessId, route.path))}>
                  <route.icon />
                  {route.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandGroup heading="Jump to">
              <CommandItem value="Choose a business" onSelect={() => go("/")}>
                <Building2Icon />
                Choose a business
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
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
      </Command>
    </CommandDialog>
  );
}
