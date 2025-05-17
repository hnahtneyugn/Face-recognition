"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// Định nghĩa kiểu vai trò người dùng
type UserRole = "user" | "admin";

// Định nghĩa kiểu dữ liệu người dùng, khớp với backend
type User = {
  user_id: number;
  fullname: string;
  email: string;
  role: UserRole;
  department: string;
  face_path?: string;
};

// Định nghĩa props cho component
interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export default function EditUserDialog({
  user,
  onClose,
  onUserUpdated,
}: EditUserDialogProps) {
  // State để quản lý trạng thái loading
  const [isLoading, setIsLoading] = useState(false);
  // State để lưu dữ liệu form, khởi tạo từ props user
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    department: user.department,
  });
  const { toast } = useToast();
  const router = useRouter();

  // Xử lý thay đổi input trong form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      if (formData.username) formDataToSend.append("username", formData.username);
      if (formData.password) formDataToSend.append("password", formData.password);
      if (formData.fullname) formDataToSend.append("fullname", formData.fullname);
      if (formData.email) formDataToSend.append("email", formData.email);
      if (formData.role) formDataToSend.append("role", formData.role);
      if (formData.department) formDataToSend.append("department", formData.department);
      // Không gửi face_image

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admins/${user.user_id}`, {
        method: 'PUT',
        body: formDataToSend,
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error ${response.status}`);
      }
      const responseData = await response.json();
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin người dùng",
      });
      // Cập nhật lại user ở cha
      onUserUpdated({
        ...user,
        fullname: formData.fullname,
        email: formData.email,
        role: formData.role,
        department: formData.department
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin người dùng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng. Bạn có thể thay đổi tên, email,
              phòng ban và vai trò.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Trường nhập tên đăng nhập */}
            <div className="space-y-2">
              <Label htmlFor="edit-username">Tên đăng nhập</Label>
              <Input
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            {/* Trường nhập mật khẩu */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">Mật khẩu mới</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {/* Trường nhập họ tên */}
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Họ tên</Label>
              <Input
                id="edit-fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
              />
            </div>
            {/* Trường nhập email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {/* Trường chọn phòng ban */}
            <div className="space-y-2">
              <Label htmlFor="edit-department">Phòng ban</Label>
              <Input
                id="edit-department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>
            {/* Trường chọn vai trò */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">Vai trò</Label>
              <select
                id="edit-role"
                name="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}