import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { businessListQuery } from "@/queries/businesses";
import { cn } from "@/lib/utils";

/** "Business Co." → "BC"; one word → its first letter. */
function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function Monogram({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-monogram text-[11px] font-semibold text-sidebar-monogram-foreground",
        className,
      )}
    >
      {name ? monogram(name) : <Building2Icon className="size-3.5!" />}
    </span>
  );
}

/** The current sub-page under /b/:businessId ("" for Overview), so switching keeps it. */
function useBusinessSubPath() {
  const { pathname } = useLocation();
  const match = /^\/b\/[^/]+(\/.*)?$/.exec(pathname);
  return match?.[1] ?? "";
}

// SPEC.md → Sidebar → Business switcher. Business only, never account details.
export default function BusinessSwitcher({ currentId }: { currentId: string | undefined }) {
  const { data: businesses = [] } = useQuery(businessListQuery());
  const { state, isMobile } = useSidebar();
  const subPath = useBusinessSubPath();
  const collapsed = state === "collapsed" && !isMobile;

  const current = businesses.find((b) => b.id === currentId);
  const label = businesses.length === 0 ? "No business yet" : (current?.name ?? "Choose a business");

  // Collapsed: the monogram only (the menu still opens).
  const buttonClass =
    "h-10 gap-2.5 px-2 hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden";

  if (businesses.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className={buttonClass} aria-disabled="true" render={<div />}>
            <Monogram />
            <span className="truncate text-sm font-semibold text-sidebar-foreground">{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className={buttonClass} aria-label={`Switch business. Current: ${label}`} />}
          >
            <Monogram name={current?.name} />
            <span className="flex-1 truncate text-sm font-semibold text-sidebar-foreground-strong">{label}</span>
            <ChevronsUpDownIcon className="size-3.5! text-sidebar-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[272px]"
            side={collapsed ? "right" : "bottom"}
            align="start"
            sideOffset={collapsed ? 12 : 4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Businesses</DropdownMenuLabel>
              {businesses.map((business) => (
                <DropdownMenuItem key={business.id} render={<Link to={`/b/${business.id}${subPath}`} />}>
                  <Monogram name={business.name} className="bg-secondary text-secondary-foreground" />
                  <span className="flex-1 truncate">{business.name}</span>
                  {business.id === currentId && <CheckIcon className="text-primary!" aria-label="Current business" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/onboarding/business" />}>
              <PlusIcon />
              Create a business
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
