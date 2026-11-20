import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLoaderData, useMatch, useParams, useSubmit } from "react-router";
import BusinessSwitcher from "@/components/shell/business-switcher";
import { businessPath, mainRoutes, setupRoutes, type NavRoute } from "@/components/shell/nav-routes";
import { loadCommandPalette, usePaletteShortcut } from "@/components/shell/palette-loader";
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
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { dashboardLoader } from "@/routes/shell/dashboard-loaders";
import { preloadPagesWhenIdle } from "@/routes/shell/page-modules";

const CommandPalette = lazy(loadCommandPalette);

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Bumped on every open: remounts the palette (fresh query) and, the first time, triggers its chunk.
  const [paletteKey, setPaletteKey] = useState(0);
  const openPalette = useCallback(() => {
    setPaletteKey((key) => key + 1);
    setPaletteOpen(true);
  }, []);
  const togglePalette = useCallback(() => {
    if (paletteOpen) setPaletteOpen(false);
    else openPalette();
  }, [paletteOpen, openPalette]);
  usePaletteShortcut(togglePalette);

  // Once the shell is up, fetch every page's code in the background so navigation never waits on it.
  useEffect(() => preloadPagesWhenIdle(), []);

  return (
    <TooltipProvider>
      {/* SPEC.md → Toast: inverse, 6 s. Bottom-right (not SPEC's bottom-left) so it never covers the
          sidebar's Connections / Settings buttons. Pages add toasts with `toast.add` from ui/toast. */}
      <Toaster />
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
          <TopBar
            user={user}
            onOpenSearch={openPalette}
            onPreloadSearch={() => void loadCommandPalette().catch(() => {}) /* a failed preload retries on open */}
            onSignOut={() => submit(null, { method: "post", action: "/logout" })}
          />
          {/* scrollbar-gutter: the scrollbar's space is always reserved, so content doesn't shift
              sideways when a page (or a skeleton) becomes shorter or taller than the window. */}
          <div className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <Outlet />
          </div>
        </div>
        {paletteKey > 0 && (
          <Suspense fallback={null}>
            <CommandPalette key={paletteKey} open={paletteOpen} onOpenChange={setPaletteOpen} />
          </Suspense>
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
}
