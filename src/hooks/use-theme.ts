import * as React from "react"

type Theme = "light" | "dark"
const STORAGE_KEY = "dayflow:theme"

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

function getInitial(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored) return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(getInitial)

  React.useEffect(() => {
    apply(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = React.useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  return { theme, setTheme, toggle }
}
