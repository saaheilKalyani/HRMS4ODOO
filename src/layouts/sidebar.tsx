import { ChevronsLeftIcon, ChevronsRightIcon, LogOutIcon, UserIcon } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { DayflowMark, DayflowWordmark } from "@/components/common/dayflow-mark"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/features/auth/auth-context"
import { navItemsForRole } from "@/layouts/nav-items"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"

const roleLabel: Record<string, string> = {
  admin: "Admin",
  hr: "HR Officer",
  employee: "Employee",
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-df-text-muted transition-colors",
          "hover:bg-df-surface-alt hover:text-df-text",
          isActive && "bg-df-accent-soft text-df-text",
          collapsed && "justify-center px-0"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-0 h-[calc(100%-16px)] w-[3px] rounded-full bg-df-accent" />
          ) : null}
          <Icon className="size-[18px] shrink-0" />
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const items = navItemsForRole(user.profile.role)

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 px-4 py-5", collapsed && "justify-center px-0")}>
        <DayflowMark size={32} />
        {!collapsed && <DayflowWordmark className="font-heading text-lg font-semibold text-df-text" />}
      </div>

      <div className={cn("mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3", collapsed && "px-2")}>
        {!collapsed && <p className="text-label px-3 pb-2 text-df-text-subtle">Menu</p>}
        {items.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-df-surface-alt",
                  collapsed && "justify-center"
                )}
              />
            }
          >
            <AvatarInitials name={user.profile.display_name} size="default" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-df-text">{user.profile.display_name}</p>
                <p className="truncate text-xs text-df-text-muted">{roleLabel[user.profile.role]}</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate(paths.profile)}>
              <UserIcon /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOutIcon /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  return (
    <aside
      className={cn(
        "relative hidden shrink-0 border-r border-border bg-df-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[264px]"
      )}
    >
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute -right-3 top-6 z-10 rounded-full bg-df-surface"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRightIcon className="size-3.5" /> : <ChevronsLeftIcon className="size-3.5" />}
      </Button>
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}
