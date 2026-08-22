import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

const palette = [
  "bg-df-accent-soft text-df-text",
  "bg-df-info-soft text-df-info",
  "bg-df-warning-soft text-df-warning",
  "bg-df-success-soft text-df-success",
  "bg-df-danger-soft text-df-danger",
]

function paletteIndex(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % palette.length
  return h
}

export function AvatarInitials({
  name,
  src,
  size = "default",
  className,
}: {
  name: string
  src?: string | null
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} className={cn(className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className={cn("font-medium", palette[paletteIndex(name)])}>
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
