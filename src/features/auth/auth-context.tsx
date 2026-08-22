import * as React from "react"

import { findPersonByLoginId, getPersonByEmployeeId, type Person } from "@/lib/mock/db"
import type { Credentials, SessionUser } from "@/types/auth"

const SESSION_KEY = "dayflow:session"

function toSessionUser(person: Person): SessionUser {
  return { profile: person.profile, employee: person.employee }
}

interface AuthContextValue {
  user: SessionUser | null
  isLoading: boolean
  signIn: (credentials: Credentials) => Promise<void>
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const employeeId = window.localStorage.getItem(SESSION_KEY)
    if (!employeeId) {
      setIsLoading(false)
      return
    }
    getPersonByEmployeeId(employeeId)
      .then((person) => {
        if (person) setUser(toSessionUser(person))
        else window.localStorage.removeItem(SESSION_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const signIn = React.useCallback(async (credentials: Credentials) => {
    const person = await findPersonByLoginId(credentials.loginId)
    if (!person || person.password !== credentials.password) {
      throw new Error("Invalid login ID or password.")
    }
    if (!person.profile.is_active) {
      throw new Error("This account has been deactivated. Contact HR.")
    }
    window.localStorage.setItem(SESSION_KEY, person.employee.id)
    setUser(toSessionUser(person))
  }, [])

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
