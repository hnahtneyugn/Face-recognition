"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Mail, User, Lock } from "lucide-react"
import { useEffect, useState } from "react"

// Định nghĩa kiểu User dựa trên API
interface User {
  user_id: string
  fullname: string
  email: string
  department: string
  face_path: string
}

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  const [imageSrc, setImageSrc] = useState<string>("/placeholder.svg?height=150&width=150")

  useEffect(() => {
    if (user.face_path) {
      // Ensure the path is correct for both development and Docker environments
      setImageSrc(user.face_path)
    }
  }, [user.face_path])

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
        <CardDescription>Xem thông tin cá nhân của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={imageSrc}
                alt={user.fullname}
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                onError={() => setImageSrc("/placeholder.svg?height=150&width=150")}
              />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">{user.fullname}</h3>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p>{user.fullname}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Đơn vị</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <p>{user.department}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">ID Người dùng</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p>{user.user_id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <div className="text-sm text-gray-500">
          <div className="flex items-center gap-2 text-amber-600">
            <Lock className="h-4 w-4" />
            <p>Để thay đổi thông tin cá nhân, vui lòng liên hệ với phòng nhân sự hoặc quản trị viên hệ thống.</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}