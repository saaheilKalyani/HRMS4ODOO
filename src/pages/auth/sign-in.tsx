import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/AuthContext"
import { AuthLayout } from "@/layouts/auth-layout"
import { signInSchema, type SignInValues } from "@/lib/validations/auth"
import { paths } from "@/routes/paths"

const demoAccounts = [
  { role: "Admin", loginId: "OIANVE20200001", password: "Admin@123" },
  { role: "Admin (HR)", loginId: "OIROME20210001", password: "Hr@12345" },
  { role: "Employee", loginId: "OIPRSH20220001", password: "Employee@123" },
]

export default function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  const onSubmit = async (values: SignInValues) => {
    setError(null)
    try {
      await signIn({ email: values.loginId, password: values.password })
      const from = (location.state as { from?: Location })?.from?.pathname ?? paths.dashboard
      navigate(from, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    }
  }

  const fillDemo = (loginId: string, password: string) => {
    setValue("loginId", loginId)
    setValue("password", password)
  }

  return (
    <AuthLayout>
      <h1 className="text-h1 text-df-text">Welcome back</h1>
      <p className="mt-1 text-sm text-df-text-muted">Sign in with your Dayflow login ID.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="loginId">Login ID / Email</Label>
          <Input
            id="loginId"
            placeholder="OIJODO20220001"
            autoComplete="username"
            aria-invalid={!!errors.loginId}
            {...register("loginId")}
          />
          {errors.loginId && <p className="text-xs text-df-danger">{errors.loginId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-df-text-subtle hover:text-df-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-df-danger">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link to={paths.forgotPassword} className="text-xs font-medium text-df-text-muted hover:text-df-text">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-df-danger-soft px-3 py-2.5 text-sm text-df-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-df-text-subtle">
        New employees are added by HR/Admin — you'll receive a Login ID and temporary password.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-df-surface-alt p-3">
        <p className="text-label mb-2 text-df-text-subtle">Demo accounts</p>
        <div className="space-y-1.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.loginId}
              type="button"
              onClick={() => fillDemo(acc.loginId, acc.password)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-df-surface"
            >
              <span className="font-medium text-df-text">{acc.role}</span>
              <span className="font-mono text-df-text-muted">{acc.loginId}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
