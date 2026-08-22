import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, XIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/AuthContext"
import { useUpdateEmployee, useUpdateEmployeeDetail, usePerson } from "@/features/employees/hooks"
import { SalaryBuilder } from "@/features/payroll/salary-builder"
import { profileEditSchema, type ProfileEditValues } from "@/lib/validations/employee"
import { MySalaryTab } from "@/pages/employees/profile/my-salary-tab"
import { PrivateInfoTab } from "@/pages/employees/profile/private-info-tab"
import { ProfileHeader } from "@/pages/employees/profile/profile-header"
import { ResumeTab } from "@/pages/employees/profile/resume-tab"
import { SecurityTab } from "@/pages/employees/profile/security-tab"

export default function EmployeeProfilePage({ mode }: { mode: "self" | "directory" }) {
  const { user } = useAuth()
  const { employeeId: routeId } = useParams()
  const targetEmployeeId = mode === "self" ? user!.employee.id : (routeId as string)

  const { data: person, isLoading } = usePerson(targetEmployeeId)
  const updateEmployee = useUpdateEmployee(targetEmployeeId)
  const updateDetail = useUpdateEmployeeDetail(targetEmployeeId)
  const [isEditing, setIsEditing] = React.useState(false)

  const { register, handleSubmit, reset } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
  })

  React.useEffect(() => {
    if (!person) return
    reset({
      phone: person.employee.phone ?? "",
      address: person.employee.address ?? "",
      about: person.detail.about,
      loves_about_job: person.detail.loves_about_job,
      interests: person.detail.interests,
      skills: person.detail.skills.join(", "),
      certifications: person.detail.certifications.join(", "),
      date_of_birth: person.detail.date_of_birth?.slice(0, 10) ?? "",
      personal_email: person.detail.personal_email,
      gender: person.detail.gender ?? "",
      marital_status: person.detail.marital_status ?? "",
      nationality: person.detail.nationality ?? "",
      bank_account_number: person.detail.bank_account_number ?? "",
      bank_name: person.detail.bank_name ?? "",
      ifsc_code: person.detail.ifsc_code ?? "",
      pan_no: person.detail.pan_no ?? "",
      uan_no: person.detail.uan_no ?? "",
    })
  }, [person, reset])

  if (isLoading || !person || !user) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  const isSelf = mode === "self"
  const isAdmin = user.profile.role === "admin"
  const showSalaryBuilder = isAdmin
  const showMySalary = isSelf && !isAdmin
  const showSecurity = isSelf

  const onSubmit = async (values: ProfileEditValues) => {
    await Promise.all([
      updateEmployee.mutateAsync({ phone: values.phone, address: values.address }),
      updateDetail.mutateAsync({
        about: values.about,
        loves_about_job: values.loves_about_job,
        interests: values.interests,
        skills: (values.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        certifications: (values.certifications ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        date_of_birth: values.date_of_birth || null,
        personal_email: values.personal_email,
        gender: values.gender || null,
        marital_status: values.marital_status || null,
        nationality: values.nationality || null,
        bank_account_number: values.bank_account_number || null,
        bank_name: values.bank_name || null,
        ifsc_code: values.ifsc_code || null,
        pan_no: values.pan_no || null,
        uan_no: values.uan_no || null,
      }),
    ])
    setIsEditing(false)
  }

  return (
    <div>
      <ProfileHeader
        employee={person.employee}
        detail={person.detail}
        email={person.profile.email}
        canEditCore={!isSelf && isAdmin}
      />

      <div>
        {isSelf && (
          <div className="mb-4 flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsEditing(false); reset() }}>
                  <XIcon data-icon="inline-start" /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateEmployee.isPending || updateDetail.isPending}
                >
                  {updateEmployee.isPending || updateDetail.isPending ? "Saving…" : "Save changes"}
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <PencilIcon data-icon="inline-start" /> Edit Profile
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="resume">
          <TabsList className="mb-5">
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="private">Private Info</TabsTrigger>
            {showMySalary && <TabsTrigger value="my-salary">My Salary</TabsTrigger>}
            {showSalaryBuilder && <TabsTrigger value="salary">Salary Info</TabsTrigger>}
            {showSecurity && <TabsTrigger value="security">Security</TabsTrigger>}
          </TabsList>

          <TabsContent value="resume">
            <ResumeTab detail={person.detail} isEditing={isEditing} register={isEditing ? register : undefined} />
          </TabsContent>
          <TabsContent value="private">
            <PrivateInfoTab
              employee={person.employee}
              detail={person.detail}
              isEditing={isEditing}
              register={isEditing ? register : undefined}
            />
          </TabsContent>
          {showMySalary && (
            <TabsContent value="my-salary">
              <MySalaryTab employeeId={person.employee.id} />
            </TabsContent>
          )}
          {showSalaryBuilder && (
            <TabsContent value="salary">
              <SalaryBuilder employeeId={person.employee.id} />
            </TabsContent>
          )}
          {showSecurity && (
            <TabsContent value="security">
              <SecurityTab employeeId={person.employee.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
