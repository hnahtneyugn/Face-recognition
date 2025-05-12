import type { Metadata } from "next"
import UserDashboard from "@/components/user/user-dashboard"

export const metadata: Metadata = {
  title: "Trang người dùng | Hệ thống điểm danh",
  description: "Trang điểm danh dành cho người dùng",
}

export default function UserPage() {
  return <UserDashboard />
}
