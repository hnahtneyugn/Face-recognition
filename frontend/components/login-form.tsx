"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  // Kiểm tra nếu đã đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      // Kiểm tra role và chuyển hướng
      const redirectToUserDashboard = () => {
        router.push("/user")
      }
      
      // Gọi API để kiểm tra token và lấy thông tin người dùng
      fetch(`${API_BASE_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Nếu có thể truy cập API người dùng, đây là tài khoản user
          redirectToUserDashboard()
        } else if (response.status === 403) {
          // Thử kiểm tra quyền admin
          return fetch(`${API_BASE_URL}/admins/`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        } else {
          // Token không hợp lệ, xóa khỏi localStorage
          localStorage.removeItem("auth_token")
          throw new Error("Token không hợp lệ")
        }
      })
      .then(response => {
        if (response && response.ok) {
          // Nếu có thể truy cập API admin, đây là tài khoản admin
          router.push("/admin")
        } else {
          // Mặc định chuyển hướng đến trang user
          redirectToUserDashboard()
        }
      })
      .catch(error => {
        console.error("Lỗi kiểm tra token:", error)
      })
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Hàm để lưu cookie (bổ sung cho localStorage)
  const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const body = new URLSearchParams()
      body.append("username", formData.username)
      body.append("password", formData.password)

      // Đăng nhập là một trường hợp đặc biệt, không sử dụng api utility 
      // vì nó cần cấu hình khác và token chưa có sẵn
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      })

      if (!response.ok) {
        throw new Error("Đăng nhập thất bại")
      }

      const data = await response.json()

      // Lưu token đúng tên auth_token
      localStorage.setItem("auth_token", data.access_token)
      
      // Lưu thêm vào cookie cho middleware
      setCookie("auth_token", data.access_token)

      const isAdmin = data.role === "admin"

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${isAdmin ? "quản trị viên" : "người dùng"}`,
      })

      router.push(isAdmin ? "/admin" : "/user")
    } catch (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: "Tên đăng nhập hoặc mật khẩu không đúng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
          placeholder="Nhập tên đăng nhập"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="Nhập mật khẩu"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Đang xử lý..." : "Đăng nhập"}
      </Button>
    </form>
  )
}
