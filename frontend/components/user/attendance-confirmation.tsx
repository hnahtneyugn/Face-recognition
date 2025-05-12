"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface UserInfo {
  user_id: string
  name: string
  email: string
  department: string
  position: string
}

interface AttendanceConfirmationProps {
  isOpen: boolean
  onClose: () => void
  userInfo: UserInfo
  onSuccess: () => void
}

export function AttendanceConfirmation({
  isOpen,
  onClose,
  userInfo,
  onSuccess,
}: AttendanceConfirmationProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await apiClient.post("/attendance/confirm", {
        user_id: userInfo.user_id,
      })
      
      toast({
        title: "Điểm danh thành công",
        description: "Thông tin điểm danh đã được cập nhật",
      })
      
      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận điểm danh. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    toast({
      title: "Đã hủy",
      description: "Đã hủy xác nhận điểm danh",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận điểm danh</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Thông tin người dùng</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Họ tên:</div>
              <div>{userInfo.name}</div>
              
              <div className="font-medium">Email:</div>
              <div>{userInfo.email}</div>
              
              <div className="font-medium">Phòng ban:</div>
              <div>{userInfo.department}</div>
              
              <div className="font-medium">Chức vụ:</div>
              <div>{userInfo.position}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 