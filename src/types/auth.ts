import type { Employee, Profile } from "@/types/domain"

/** A signed-in user: their auth profile joined with their HR employee record. */
export interface SessionUser {
  profile: Profile
  employee: Employee
}

export interface Credentials {
  loginId: string
  password: string
}
