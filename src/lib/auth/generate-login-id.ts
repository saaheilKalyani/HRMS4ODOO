/**
 * Login ID format (DayflowBuildPrompt.md §7.1):
 * OI{First2LettersFirstName}{First2LettersLastName}{YearOfJoining}{4-digitSerial}
 * e.g. "OIJODO20220001". Only Admin/HR create employees, so this is generated
 * server-side in production — this mirrors that logic for the mock layer and
 * for the New Employee form preview.
 */
export function generateLoginId(
  firstName: string,
  lastName: string,
  joiningDate: string,
  serial: number
): string {
  const f = firstName.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X")
  const l = lastName.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X")
  const year = new Date(joiningDate).getFullYear()
  const serialStr = String(serial).padStart(4, "0")
  return `OI${f}${l}${year}${serialStr}`
}

export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}
