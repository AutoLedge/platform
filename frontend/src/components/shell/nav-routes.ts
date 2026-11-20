import {
  ArrowLeftRightIcon,
  CircleCheckIcon,
  FileTextIcon,
  LayoutGridIcon,
  LinkIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";

export type NavRoute = {
  label: string;
  path: string; // relative to /b/:businessId ('' = Overview)
  icon: LucideIcon;
};

// SPEC.md → Sidebar → Nav icons. Shared by the sidebar and the command palette.
export const mainRoutes: NavRoute[] = [
  { label: "Overview", path: "", icon: LayoutGridIcon },
  { label: "Reconciliation", path: "reconciliation", icon: CircleCheckIcon },
  { label: "Transactions", path: "transactions", icon: ArrowLeftRightIcon },
  { label: "Invoices", path: "invoices", icon: FileTextIcon },
];

export const setupRoutes: NavRoute[] = [
  { label: "Connections", path: "connections", icon: LinkIcon },
  { label: "Settings", path: "settings", icon: SlidersHorizontalIcon },
];

export function businessPath(businessId: string, path: string) {
  return path ? `/b/${businessId}/${path}` : `/b/${businessId}`;
}
