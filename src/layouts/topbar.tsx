import { BellIcon, LogOutIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { CheckInOutWidget } from "@/features/attendance/checkin-widget"
import { useAuth } from "@/features/auth/auth-context"
import { useTheme } from "@/hooks/use-theme"
import { paths } from "@/routes/paths"

const roleLabel: Record<string, string> = {
  admin: "Admin",
  hr: "HR Officer",
  employee: "Employee",
}

export function Topbar({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border bg-df-surface px-4 sm:px-6">
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open menu"
      >
        <MenuIcon />
      </Button>

      <div className="relative hidden w-full max-w-[320px] sm:block">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-df-text-subtle" />
        <Input
          placeholder="Search employees, requests…"
          className="h-10 rounded-full bg-df-surface-alt pl-9"
        />
      </div>

      <div className="flex-1" />

      <div className="hidden md:block">
        <CheckInOutWidget compact />
      </div>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-df-surface-alt"
        onClick={toggle}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full bg-df-surface-alt"
        aria-label="Notifications"
      >
        <BellIcon />
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-df-danger" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<button type="button" className="flex items-center gap-2.5 rounded-full pl-1" />}
        >
          <AvatarInitials name={user.profile.display_name} />
          <div className="hidden text-left leading-tight md:block">
            <p className="text-sm font-medium text-df-text">{user.profile.display_name}</p>
            <p className="text-xs text-df-text-muted">{roleLabel[user.profile.role]}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate(paths.profile)}>
            <UserIcon /> My Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={signOut}>
            <LogOutIcon /> Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
