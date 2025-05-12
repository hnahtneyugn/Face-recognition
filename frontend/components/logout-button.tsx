"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = () => {
    // Xóa token khỏi localStorage
    localStorage.removeItem("token")
    
    // Hiển thị thông báo
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống",
    })

    // Chuyển hướng về trang đăng nhập
    router.push("/login")
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Đăng xuất
    </Button>
  )
} 