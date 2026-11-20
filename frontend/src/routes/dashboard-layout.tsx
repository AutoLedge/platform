import { useState } from "react";
import { Link, Outlet, useLoaderData, useMatch, useParams, useSubmit } from "react-router";
import {
  ArrowLeftRightIcon,
  CircleCheckIcon,
  FileTextIcon,
  LayoutGridIcon,
  LinkIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import BusinessSwitcher from "@/components/shell/business-switcher";
import TopBar from "@/components/shell/top-bar";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { dashboardLoader } from "@/routes/dashboard-loaders";

type NavRoute = {
  label: string;
  path: string; // relative to /b/:businessId ('' = Overview)
  icon: LucideIcon;
};

// SPEC.md → Sidebar → Nav icons.
const mainRoutes: NavRoute[] = [
  { label: "Overview", path: "", icon: LayoutGridIcon },
  { label: "Reconciliation", path: "reconciliation", icon: CircleCheckIcon },
  { label: "Transactions", path: "transactions", icon: ArrowLeftRightIcon },
  { label: "Invoices", path: "invoices", icon: FileTextIcon },
];

const setupRoutes: NavRoute[] = [
  { label: "Connections", path: "connections", icon: LinkIcon },
  { label: "Settings", path: "settings", icon: SlidersHorizontalIcon },
];

function businessPath(businessId: string, path: string) {
  return path ? `/b/${businessId}/${path}` : `/b/${businessId}`;
}

function NavItem({ route, businessId }: { route: NavRoute; businessId: string | undefined }) {
  const target = businessId ? businessPath(businessId, route.path) : "/";
  const match = useMatch({ path: target, end: route.path === "" });
  const Icon = route.icon;
  const content = (
    <>
      <Icon />
      <span>{route.label}</span>
    </>
  );

  // No business in the URL (home, onboarding): Overview leads home, the rest is dimmed and inert,
  // so nothing can link to a business page without a business id.
  if (!businessId && route.path !== "") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton render={<span />} aria-disabled="true" tooltip={route.label}>
          {content}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const active = Boolean(match);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={target} aria-current={active ? "page" : undefined} />}
        isActive={active}
        tooltip={route.label}
      >
        {content}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebar() {
  const { businessId } = useParams();
  return (
    <Sidebar collapsible="icon">
      {/* 56px header row; its bottom border lines up with the top bar's. */}
      <SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border px-3 py-0">
        <BusinessSwitcher currentId={businessId} />
      </SidebarHeader>
      <SidebarContent className="gap-0 px-3 py-4">
        <nav aria-label="Main" className="contents">
          <SidebarMenu className="gap-0.5">
            {mainRoutes.map((route) => (
              <NavItem key={route.label} route={route} businessId={businessId} />
            ))}
          </SidebarMenu>
          <SidebarMenu className="mt-auto gap-0.5" aria-label="Setup">
            {setupRoutes.map((route) => (
              <NavItem key={route.label} route={route} businessId={businessId} />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}

// Sidebar choice (expanded or rail) on desktop, remembered across visits. Convenience only.
const SIDEBAR_KEY = "autoledge-sidebar";

function readSidebarOpen() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "collapsed";
  } catch {
    return true;
  }
}

function saveSidebarOpen(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "expanded" : "collapsed");
  } catch {
    // storage blocked: the choice lasts until reload
  }
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof dashboardLoader>();
  const submit = useSubmit();
  // 768–1023: always the icon rail (SPEC.md → Breakpoints). Below 768 shadcn's slide-out panel applies.
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const [desktopOpen, setDesktopOpen] = useState(readSidebarOpen);

  return (
    <TooltipProvider>
      <SidebarProvider
        open={isTablet ? false : desktopOpen}
        onOpenChange={(open) => {
          if (isTablet) return;
          setDesktopOpen(open);
          saveSidebarOpen(open);
        }}
        className="h-svh min-h-0 overflow-hidden"
      >
        <AppSidebar />
        {/* The shell is one viewport tall; only this column scrolls (pages render their own <main>). */}
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <TopBar user={user} onSignOut={() => submit(null, { method: "post", action: "/logout" })} />
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
