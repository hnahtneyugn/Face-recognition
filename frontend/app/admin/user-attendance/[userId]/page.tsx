"use client"
import { useParams, useSearchParams } from "next/navigation"
import UserAttendanceHistory from "@/components/admin/user-attendance-history"

export default function UserAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  const userName = searchParams.get("name") || "Người dùng"

  return (
    <div className="container mx-auto py-8 px-4">
      <UserAttendanceHistory userId={userId} userName={userName} />
    </div>
  )
}
