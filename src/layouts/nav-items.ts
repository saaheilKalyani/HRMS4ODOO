import {
  CalendarCheckIcon,
  LayoutDashboardIcon,
  PlaneTakeoffIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import { paths } from "@/routes/paths"
import type { UserRole } from "@/types/domain"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles?: UserRole[]
}

export const navItems: NavItem[] = [
  { label: "Dashboard", to: paths.dashboard, icon: LayoutDashboardIcon },
  { label: "Employees", to: paths.employees, icon: UsersIcon, roles: ["admin", "hr"] },
  { label: "Attendance", to: paths.attendance, icon: CalendarCheckIcon },
  { label: "Time Off", to: paths.timeOff, icon: PlaneTakeoffIcon },
  { label: "Salary", to: paths.salary, icon: WalletIcon, roles: ["admin"] },
  { label: "Settings", to: paths.settings, icon: SettingsIcon },
]

export function navItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || item.roles.includes(role))
}
