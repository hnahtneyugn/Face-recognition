import type { Metadata } from "next"
import DailyAttendanceList from "@/components/admin/daily-attendance-list"

export const metadata: Metadata = {
  title: "Điểm danh hôm nay | Hệ thống điểm danh",
  description: "Danh sách điểm danh của nhân viên trong ngày hôm nay",
}

export default function DailyAttendancePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Điểm danh hôm nay</h1>
      <DailyAttendanceList />
    </div>
  )
}
