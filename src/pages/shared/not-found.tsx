import { CompassIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { paths } from "@/routes/paths"

export default function NotFoundPage() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-df-surface-alt text-df-text-subtle">
        <CompassIcon className="size-6" />
      </div>
      <h1 className="text-h1 mt-4 text-df-text">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-df-text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button className="mt-6" render={<Link to={user ? paths.dashboard : paths.signIn} />}>
        {user ? "Back to Dashboard" : "Back to Sign In"}
      </Button>
    </div>
  )
}
