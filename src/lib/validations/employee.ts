import { z } from "zod"

export const newEmployeeSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  department: z.string().min(1, "Select a department"),
  jobTitle: z.string().min(1, "Required"),
  joiningDate: z.string().min(1, "Required"),
  role: z.enum(["employee", "admin"]),
})
export type NewEmployeeValues = z.infer<typeof newEmployeeSchema>

export const profileEditSchema = z.object({
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(1, "Required"),
  about: z.string().optional(),
  loves_about_job: z.string().optional(),
  interests: z.string().optional(),
  skills: z.string().optional(),
  certifications: z.string().optional(),
  date_of_birth: z.string().optional(),
  personal_email: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  nationality: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_name: z.string().optional(),
  ifsc_code: z.string().optional(),
  pan_no: z.string().optional(),
  uan_no: z.string().optional(),
})
export type ProfileEditValues = z.infer<typeof profileEditSchema>

export const employeeCoreEditSchema = z.object({
  phone: z.string().min(6, "Enter a valid phone number"),
  department: z.string().min(1, "Required"),
  jobTitle: z.string().min(1, "Required"),
  employmentStatus: z.enum(["Active", "Inactive"]),
})
export type EmployeeCoreEditValues = z.infer<typeof employeeCoreEditSchema>
