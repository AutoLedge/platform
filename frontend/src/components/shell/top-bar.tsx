import { useState } from "react";
import { Link, useMatches, useNavigate, useParams } from "react-router";
import {
  BellIcon,
  ChevronDownIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SunIcon,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shortcutLabel } from "@/lib/platform";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import type { DashboardUser, RouteHandle } from "@/routes/dashboard-loaders";

function SidebarToggle() {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const label = isMobile ? "Open navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar";
  const Icon = collapsed || isMobile ? PanelLeftOpenIcon : PanelLeftCloseIcon;
  // 768–1023 is always the rail (SPEC.md → Breakpoints), so the trigger is hidden there.
  return (
    <div className="-ml-3 flex items-center md:max-lg:hidden">
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" aria-label={label} aria-keyshortcuts="Control+B Meta+B" onClick={toggleSidebar} />}
        >
          <Icon className="size-[18px] text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {label} <Kbd>{shortcutLabel("B")}</Kbd>
        </TooltipContent>
      </Tooltip>
      <span aria-hidden="true" className="mr-2 ml-1 h-5 w-px bg-border" />
    </div>
  );
}

function PageBreadcrumb() {
  const { businessId } = useParams();
  const matches = useMatches();
  const title = [...matches].reverse().map((m) => (m.handle as RouteHandle | undefined)?.title).find(Boolean);
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1 sm:gap-1">
        <BreadcrumbItem>
          <Link
            to={businessId ? `/b/${businessId}` : "/"}
            aria-label="AutoLedge home"
            className="flex rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
          >
            <LogoMark />
          </Link>
        </BreadcrumbItem>
        {title && (
          <>
            <li role="presentation" aria-hidden="true" className="px-0.5 text-lg/none font-light text-input">
              /
            </li>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate px-1.5 text-sm font-medium text-foreground">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function GlobalSearchButton({ onClick }: { onClick: () => void }) {
  // Opens the command palette (also Ctrl/⌘ K).
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="hidden w-[220px] justify-start gap-2 border-border bg-card px-2.5 font-normal text-muted-foreground md:inline-flex"
      aria-label="Search AutoLedge"
      aria-keyshortcuts="Control+K Meta+K"
    >
      <SearchIcon />
      <span className="flex-1 text-left">Search AutoLedge</span>
      <Kbd>{shortcutLabel("K")}</Kbd>
    </Button>
  );
}

function Notifications() {
  // No notifications API yet: always the empty state.
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-9" aria-label="Notifications" />}>
        <BellIcon className="size-[18px]" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px]">
        <p className="px-2 pt-1.5 font-medium">Notifications</p>
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>You're all caught up</EmptyTitle>
            <EmptyDescription>New activity on your accounts shows up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PopoverContent>
    </Popover>
  );
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? "?")).toUpperCase();
}

const THEMES: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

function AccountMenu({ user, onSignOut }: { user: DashboardUser; onSignOut: () => void }) {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const [theme, setThemeState] = useState<Theme>(getTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="gap-1.5 px-1.5" aria-label={`Account menu for ${user.name}`} />}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
          {initials(user.name)}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[256px]">
        <div className="min-w-0 px-2 py-2">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {businessId && (
            <DropdownMenuItem onClick={() => navigate(`/b/${businessId}/settings`)}>
              <SlidersHorizontalIcon />
              Preferences
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoyIcon />
            Help and support
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: Theme) => {
            setTheme(value);
            setThemeState(value);
          }}
        >
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} closeOnClick={false}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// SPEC.md → Top bar (56px).
export default function TopBar({
  user,
  onOpenSearch,
  onSignOut,
}: {
  user: DashboardUser;
  onOpenSearch: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background pr-6 pl-8 max-md:pr-4 max-md:pl-4">
      <SidebarToggle />
      <PageBreadcrumb />
      <span className="flex-1" />
      <GlobalSearchButton onClick={onOpenSearch} />
      <Notifications />
      <AccountMenu user={user} onSignOut={onSignOut} />
    </header>
  );
}
