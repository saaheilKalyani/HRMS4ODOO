import type { UseFormRegister } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EmployeeProfileDetail } from "@/types/domain"
import type { ProfileEditValues } from "@/lib/validations/employee"

export function ResumeTab({
  detail,
  isEditing,
  register,
}: {
  detail: EmployeeProfileDetail
  isEditing: boolean
  register?: UseFormRegister<ProfileEditValues>
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && register ? (
            <Textarea rows={3} {...register("about")} />
          ) : (
            <p className="text-sm text-df-text-muted">{detail.about || "No bio added yet."}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What I love about my job</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && register ? (
              <Textarea rows={3} {...register("loves_about_job")} />
            ) : (
              <p className="text-sm text-df-text-muted">{detail.loves_about_job || "—"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interests & hobbies</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && register ? (
              <Textarea rows={3} {...register("interests")} />
            ) : (
              <p className="text-sm text-df-text-muted">{detail.interests || "—"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && register ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-df-text-subtle">Comma-separated</Label>
              <Textarea rows={2} {...register("skills")} placeholder="React, Figma, SQL" />
            </div>
          ) : detail.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map((s) => (
                <Badge key={s} variant="secondary" className="h-6 px-2.5">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-df-text-muted">No skills added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && register ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-df-text-subtle">Comma-separated</Label>
              <Textarea rows={2} {...register("certifications")} />
            </div>
          ) : detail.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.certifications.map((c) => (
                <Badge key={c} variant="outline" className="h-6 px-2.5">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-df-text-muted">No certifications added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
