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
  // State để lưu file ảnh khuôn mặt
  const [faceImage, setFaceImage] = useState<File | null>(null);
  // State để lưu danh sách phòng ban từ API
  const [departments, setDepartments] = useState<string[]>([]);
  // State để hiển thị dialog xác nhận
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Hook để hiển thị thông báo
  const { toast } = useToast();
  // Hook để điều hướng
  const router = useRouter();

  // Tải danh sách phòng ban khi component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      try {
        // Gọi API để lấy danh sách phòng ban
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
          }/admins/departments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          }
          throw new Error("Lỗi khi tải danh sách phòng ban");
        }

        const data = await response.json();
        setDepartments(data);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách phòng ban",
          variant: "destructive",
        });
        if (error.message.includes("Phiên đăng nhập hết hạn")) {
          router.push("/login");
        }
      }
    };

    fetchDepartments();
  }, [toast, router]);

  // Xử lý thay đổi input trong form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi file ảnh khuôn mặt
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaceImage(file);
    }
  };

  // Xử lý thay đổi vai trò
  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };

  // Xử lý thay đổi phòng ban
  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Kiểm tra dữ liệu form bắt buộc
    if (!formData.fullname || !formData.email || !formData.department) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ họ tên, email và phòng ban",
        variant: "destructive",
      });
      return;
    }
    // Kiểm tra định dạng email
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!isValidEmail) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  // Xác nhận cập nhật thông tin người dùng
  const confirmUpdate = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }

      // Chuẩn bị dữ liệu gửi API
      const formDataToSend = new FormData();
      if (formData.username) formDataToSend.append("username", formData.username);
      if (formData.password) formDataToSend.append("password", formData.password);
      formDataToSend.append("fullname", formData.fullname);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("department", formData.department);
      if (faceImage) formDataToSend.append("face_image", faceImage);

      // Gọi API để cập nhật thông tin người dùng
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        }/admins/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        throw new Error(errorData.detail || "Lỗi khi cập nhật thông tin người dùng");
      }

      // Cập nhật thông tin người dùng trong state cha
      const updatedUser: User = {
        ...user,
        fullname: formData.fullname,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        face_path: faceImage ? URL.createObjectURL(faceImage) : user.face_path,
      };

      onUserUpdated(updatedUser);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin người dùng",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin người dùng",
        variant: "destructive",
      });
      if (error.message.includes("Phiên đăng nhập hết hạn")) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Dialog chỉnh sửa thông tin người dùng */}
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin người dùng. Bạn có thể thay đổi tên, email,
                phòng ban, vai trò và ảnh khuôn mặt.
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
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger id="edit-department">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Trường chọn vai trò */}
              <div className="space-y-2">
                <Label htmlFor="edit-role">Vai trò</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Người dùng</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Trường upload ảnh khuôn mặt */}
              <div className="space-y-2">
                <Label htmlFor="edit-face-image">Ảnh khuôn mặt</Label>
                <Input
                  id="edit-face-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
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

      {/* Dialog xác nhận cập nhật */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn cập nhật thông tin của người dùng "
              {user.fullname}" không?
              {user.role !== formData.role && (
                <p className="mt-2 font-medium">
                  {formData.role === "admin"
                    ? "Người dùng này sẽ được nâng cấp thành Quản trị viên."
                    : "Người dùng này sẽ bị hạ cấp thành Người dùng thường."}
                </p>
              )}
              {faceImage && (
                <p className="mt-2 font-medium">
                  Ảnh khuôn mặt của người dùng sẽ được cập nhật.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}