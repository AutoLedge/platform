import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  KeyboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
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
import { Kbd } from "@/components/ui/kbd";
import { usePanel, useSpecimenOpen } from "./panel-context";
import { Sheet, Specimen } from "./panel";

function Monogram({ children }: { children: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground">
      {children}
    </span>
  );
}

function BusinessSwitcherMenu() {
  const container = usePanel();
  const menu = useSpecimenOpen();
  const [business, setBusiness] = useState("bc");
  return (
    <DropdownMenu modal={false} {...menu}>
      {/* Sample trigger on the sidebar colour; the real switcher is built in N22.3. */}
      <DropdownMenuTrigger
        render={
          <Button className="h-10 w-[240px] justify-start gap-2.5 bg-sidebar px-2 text-sidebar-foreground-strong hover:bg-sidebar-accent" />
        }
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-monogram text-[11px] font-semibold text-sidebar-monogram-foreground">
          BC
        </span>
        <span className="flex-1 truncate text-left text-sm font-semibold">Business Co.</span>
        <ChevronsUpDownIcon className="size-3.5 text-sidebar-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} className="w-[272px]">
        <DropdownMenuRadioGroup value={business} onValueChange={setBusiness}>
          <DropdownMenuLabel>Businesses</DropdownMenuLabel>
          <DropdownMenuRadioItem value="bc">
            <Monogram>BC</Monogram>
            <span className="flex-1 truncate">Business Co.</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="sb">
            <Monogram>SB</Monogram>
            <span className="flex-1 truncate">[Second business]</span>
            <Kbd>⌘2</Kbd>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="tb">
            <Monogram>TB</Monogram>
            <span className="flex-1 truncate">[Third business]</span>
            <Kbd>⌘3</Kbd>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PlusIcon />
            Add a business
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Business settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const container = usePanel();
  const menu = useSpecimenOpen();
  const [theme, setTheme] = useState("light");
  return (
    <DropdownMenu modal={false} {...menu}>
      <DropdownMenuTrigger render={<Button variant="ghost" className="gap-1.5 px-1.5" aria-label="Account" />}>
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
          SV
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} align="end" className="w-[256px]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            SV
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">Sebastian</p>
            <p className="truncate text-xs text-muted-foreground">[email address]</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SlidersHorizontalIcon />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuItem>
            <KeyboardIcon />
            <span className="flex-1">Keyboard shortcuts</span>
            <Kbd>?</Kbd>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoyIcon />
            Help and support
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Same radio group as the app's account menu (N22.3). */}
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioItem value="light" closeOnClick={false}>
            <SunIcon className="size-4 text-muted-foreground" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick={false}>
            <MoonIcon className="size-4 text-muted-foreground" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick={false}>
            <MonitorIcon className="size-4 text-muted-foreground" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenusSheet() {
  return (
    <Sheet title="Menus" note="components-menus.html: business switcher and account menu.">
      <Specimen
        title="Business switcher"
        note="Opens from the sidebar header. Switching keeps the current page."
        height={330}
      >
        <BusinessSwitcherMenu />
      </Specimen>
      <Specimen title="Account menu" note="Opens from the avatar, aligned to its right edge. Theme lives here." height={400}>
        <div className="flex w-[256px] justify-end">
          <AccountMenu />
        </div>
      </Specimen>
    </Sheet>
  );
}
