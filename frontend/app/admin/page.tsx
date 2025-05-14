import type { Metadata } from "next"
import AdminDashboard from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Trang quản trị | Hệ thống điểm danh",
  description: "Trang quản lý người dùng dành cho quản trị viên",
}

export default function AdminPage() {
  return <AdminDashboard />
}
