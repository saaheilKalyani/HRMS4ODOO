import { MoonIcon, RotateCcwIcon, SunIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { useTheme } from "@/hooks/use-theme"
import { resetDemoData } from "@/lib/mock/db"
import { paths } from "@/routes/paths"

const roleLabel: Record<string, string> = {
  admin: "Admin",
  hr: "HR Officer",
  employee: "Employee",
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  if (!user) return null

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Settings" description="Manage your appearance and account preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Dayflow looks on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
            <SunIcon data-icon="inline-start" /> Light
          </Button>
          <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
            <MoonIcon data-icon="inline-start" /> Dark
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {user.profile.display_name} · {roleLabel[user.profile.role]} · {user.profile.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link to={paths.profile} />}>
            Edit profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
          <CardDescription>
            This build runs on locally stored sample data. Reset it to restore the original seeded scenario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={resetDemoData}>
            <RotateCcwIcon data-icon="inline-start" /> Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
