import { ShieldAlertIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { paths } from "@/routes/paths"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-df-danger-soft text-df-danger">
        <ShieldAlertIcon className="size-6" />
      </div>
      <h1 className="text-h1 mt-4 text-df-text">You don't have access to this page</h1>
      <p className="mt-1 max-w-sm text-sm text-df-text-muted">
        This area is restricted based on your role. Contact HR/Admin if you believe this is a mistake.
      </p>
      <Button className="mt-6" render={<Link to={paths.dashboard} />}>
        Back to Dashboard
      </Button>
    </div>
  )
}
