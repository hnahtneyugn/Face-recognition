"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const body = new URLSearchParams()
      body.append("username", formData.username)
      body.append("password", formData.password)
      body.append("grant_type", "password")

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (!response.ok) {
        throw new Error(data.detail || "Đăng nhập thất bại")
      }

      if (!data.access_token || !data.role) {
        throw new Error("Thiếu thông tin xác thực từ server")
      }

      localStorage.setItem("token", data.access_token)
      await new Promise(res => setTimeout(res, 100))
      const isAdmin = data.role.toLowerCase() === "admin"

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${isAdmin ? "quản trị viên" : "người dùng"}`,
      })

      router.push(isAdmin ? "/admin" : "/user")
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Tên đăng nhập hoặc mật khẩu không đúng",
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
