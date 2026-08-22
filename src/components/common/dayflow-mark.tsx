export function DayflowMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="10" fill="var(--df-accent)" />
      <path
        d="M9 20.5C9 15.8056 12.8056 12 17.5 12C18.8807 12 20 13.1193 20 14.5C20 15.8807 18.8807 17 17.5 17C15.567 17 14 18.567 14 20.5C14 22.433 15.567 24 17.5 24"
        stroke="var(--df-text-on-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="21.5" cy="9.5" r="2.5" fill="var(--df-text-on-accent)" />
    </svg>
  )
}

export function DayflowWordmark({ className }: { className?: string }) {
  return <span className={className}>Dayflow</span>
}
