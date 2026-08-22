import type { ReactNode } from "react"

import { DayflowMark, DayflowWordmark } from "@/components/common/dayflow-mark"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-df-bg px-4 py-10">
      <div
        className="pointer-events-none absolute top-[-10%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--df-accent-soft), transparent)" }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[440px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <DayflowMark size={32} />
          <DayflowWordmark className="font-heading text-xl font-semibold text-df-text" />
        </div>
        <div className="rounded-3xl border border-border bg-df-surface p-8 shadow-df-lg">{children}</div>
        <p className="mt-6 text-center text-xs text-df-text-subtle">
          Every workday, perfectly aligned.
        </p>
      </div>
    </div>
  )
}
