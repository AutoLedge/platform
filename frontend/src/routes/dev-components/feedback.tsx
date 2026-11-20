import { useEffect, useState } from "react";
import { BellIcon, CircleCheckIcon, PanelLeftCloseIcon, UnplugIcon, ArrowLeftRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  useToastManager,
} from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePanel, useSpecimenOpen } from "./panel-context";
import { Sheet, Specimen } from "./panel";

function Tooltips() {
  const container = usePanel();
  return (
    <TooltipProvider>
      <div className="flex w-[300px] flex-col items-start gap-14 pt-9">
        <Tooltip open>
          <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Collapse sidebar" />}>
            <PanelLeftCloseIcon className="size-[18px] text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent container={container} side="right">
            Collapse sidebar <Kbd>⌘B</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip open>
          <TooltipTrigger render={<span className="text-[13px] font-medium text-muted-foreground tabular-nums" />}>
            −$412.60
          </TooltipTrigger>
          <TooltipContent container={container} side="right" className="max-w-[220px]">
            Pending — the amount may change when it clears, usually in 1–3 business days.
          </TooltipContent>
        </Tooltip>
        <Tooltip open>
          <TooltipTrigger render={<span className="block w-[160px] truncate text-[13px] font-medium" />}>
            Northstar Studio Design &amp; Production Ltd.
          </TooltipTrigger>
          <TooltipContent container={container} side="bottom" align="start">
            Northstar Studio Design &amp; Production Ltd.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((t) => (
    <Toast key={t.id} toast={t}>
      <ToastContent>
        <CircleCheckIcon className="size-4 shrink-0" />
        <ToastTitle className="min-w-0 flex-1" />
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/** A real Base UI toast, held open inside this panel (it is fixed bottom-right in the app). */
function SampleToast() {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [manager] = useState(() => createToastManager());
  useEffect(() => {
    const id = manager.add({
      title: "Matched Shell to [BILL-0000]",
      type: "success",
      timeout: 0,
      actionProps: { children: "Undo" },
    });
    return () => manager.close(id);
  }, [manager]);
  return (
    <ToastProvider toastManager={manager}>
      <div ref={setBox} className="relative h-12 w-[400px]" />
      {box && (
        <ToastPortal container={box}>
          <ToastViewport className="absolute inset-0 m-0 w-full max-w-none sm:right-0 sm:left-0">
            <ToastList />
          </ToastViewport>
        </ToastPortal>
      )}
    </ToastProvider>
  );
}

const NOTIFICATIONS = [
  { icon: UnplugIcon, title: "Chequing ••4821 needs to reconnect", meta: "Transactions stopped syncing · 2h ago", unread: true },
  { icon: ArrowLeftRightIcon, title: "12 transactions are unmatched", meta: "October · Review in Reconciliation", unread: true },
  { icon: RefreshCwIcon, title: "Synced 6 new transactions", meta: "Chequing ••4821 · Yesterday", unread: false },
];

function NotificationsPanel({ empty }: { empty?: boolean }) {
  const container = usePanel();
  const popover = useSpecimenOpen();
  return (
    <Popover {...popover}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-9" aria-label="Notifications" />}>
        <BellIcon className="size-[18px]" />
      </PopoverTrigger>
      <PopoverContent container={container} align="end" className="w-[340px]">
        <div className="flex items-center justify-between px-2 pt-1">
          <p className="font-medium">Notifications</p>
          {!empty && (
            <Button variant="link" size="sm" className="px-0">
              Mark all as read
            </Button>
          )}
        </div>
        {empty ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>You're all caught up</EmptyTitle>
              <EmptyDescription>New activity on your accounts shows up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {NOTIFICATIONS.map((n) => (
              <div key={n.title} className="flex gap-2.5 rounded-md px-2 py-2 hover:bg-accent">
                <n.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className={cn(n.unread && "font-medium")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.meta}</p>
                </div>
                {n.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </div>
            ))}
            <Separator className="my-1" />
            <Button variant="ghost" size="sm" className="w-full">
              View all activity
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FeedbackSheet() {
  return (
    <Sheet
      title="Feedback"
      note="components-feedback.html. Notifications content needs an API: the app shows the empty state until then."
    >
      <Specimen title="Tooltips" note="Inverse, 12px, after 400ms hover or on focus." height={220}>
        <Tooltips />
      </Specimen>
      <Specimen title="Toast" note="Bottom-right in the app (keeps the sidebar clear), 6 seconds, Undo for reversible actions.">
        <SampleToast />
      </Specimen>
      <Specimen title="Notifications" height={300}>
        <div className="flex w-[340px] justify-end">
          <NotificationsPanel />
        </div>
      </Specimen>
      <Specimen title="Notifications · empty (used in N22.3)" height={260}>
        <div className="flex w-[340px] justify-end">
          <NotificationsPanel empty />
        </div>
      </Specimen>
    </Sheet>
  );
}
