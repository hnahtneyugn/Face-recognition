"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X } from "lucide-react";
import { apiClient } from '@/lib/api-client';

interface AddUserFormProps {
  onUserAdded: () => void;
}

export default function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    fullname: "",
  });
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  // Validation form
  const validateForm = () => {
    if (!formData.username || formData.username.length < 8 || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
      toast({
        title: "Lỗi",
        description: "Tên đăng nhập phải là chữ hoặc số và dài ít nhất 8 ký tự",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải dài ít nhất 8 ký tự",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.fullname || formData.fullname.length < 2) {
      toast({
        title: "Lỗi",
        description: "Họ và tên phải dài ít nhất 2 ký tự",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.department) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập phòng ban",
        variant: "destructive",
      });
      return false;
    }
    if (!faceFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng cung cấp ảnh khuôn mặt",
        variant: "destructive",
      });
      return false;
    }
    if (!['user', 'admin'].includes(formData.role)) {
      toast({
        title: "Lỗi",
        description: "Vai trò chỉ được là 'user' hoặc 'admin'",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Kiểm tra form hợp lệ để enable/disable nút submit
  const isFormValid = () => {
    return (
      formData.username &&
      formData.email &&
      formData.password &&
      formData.fullname &&
      formData.department &&
      faceFile &&
      formData.username.length >= 8 &&
      /^[a-zA-Z0-9]+$/.test(formData.username) &&
      formData.password.length >= 8 &&
      formData.fullname.length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      ['user', 'admin'].includes(formData.role)
    );
  };

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi select
  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Mở camera
  const handleOpenCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      toast({
        title: "Lỗi camera",
        description:
          "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập trong cài đặt trình duyệt hoặc chọn tải ảnh lên.",
        variant: "destructive",
      });
    }
  };

  // Đóng camera
  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Chụp ảnh từ camera
  const handleCaptureImage = () => {
    if (!stream) return;

    const video = document.querySelector("video");
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setFaceImage(imageDataUrl);

    // Chuyển base64 thành File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "face_image.jpg", { type: "image/jpeg" });
        setFaceFile(file);
      }
    }, "image/jpeg");

    handleCloseCamera();
  };

  // Xử lý tải file ảnh
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Ảnh khuôn mặt không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra định dạng file
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file JPG hoặc PNG",
        variant: "destructive",
      });
      return;
    }

    setFaceFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setFaceImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh
  const handleRemoveImage = () => {
    setFaceImage(null);
    setFaceFile(null);
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Chuyển file thành base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              // Lấy phần base64 sau dấu phẩy
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else {
              reject(new Error('Failed to convert file to base64'));
            }
          };
          reader.onerror = error => reject(error);
        });
      };

      // Kiểm tra và log thông tin file
      if (!faceFile) {
        throw new Error("No face image provided");
      }

      console.log("File info:", {
        name: faceFile.name,
        type: faceFile.type,
        size: faceFile.size,
      });

      // Chuyển file thành base64
      const base64Image = await fileToBase64(faceFile);
      console.log("Base64 image length:", base64Image.length);

      // Tạo object dữ liệu
      const dataToSend = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        fullname: formData.fullname,
        email: formData.email,
        department: formData.department,
        face_image: base64Image,
        file_name: faceFile.name,
        file_type: faceFile.type
      };

      // Log dữ liệu gửi đi
      console.log("Sending data:", {
        ...dataToSend,
        face_image: `[Base64 string length: ${base64Image.length}]`
      });

      const response = await apiClient.post(`/admins/`, dataToSend);

      console.log("Response:", response);

      toast({
        title: "Thành công",
        description: `Đã thêm người dùng ${formData.fullname}`,
      });

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        department: "",
        fullname: "",
      });
      setFaceImage(null);
      setFaceFile(null);

      // Gọi callback để thông báo component cha
      onUserAdded();
    } catch (error: any) {
      console.error("Error details:", error);
      
      let errorMessage = "Không thể thêm người dùng mới";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        errorMessage = "Không nhận được phản hồi từ máy chủ";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Thêm người dùng mới</CardTitle>
          <CardDescription>
            Nhập thông tin để tạo tài khoản người dùng mới. Với quyền quản trị viên, bạn có thể tạo cả tài khoản người
            dùng thường và tài khoản quản trị viên.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullname">Họ và tên</Label>
              <Input
                id="fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Phòng ban</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Nhập phòng ban"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ảnh khuôn mặt</Label>

            {faceImage ? (
              <div className="relative w-40 h-40 mx-auto border rounded-lg overflow-hidden">
                <img src={faceImage} alt="Ảnh khuôn mặt" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : isCameraOpen ? (
              <div className="space-y-4">
                <div className="relative border rounded-lg overflow-hidden max-w-md mx-auto">
                  <video
                    autoPlay
                    playsInline
                    ref={(videoElement) => {
                      if (videoElement && stream) {
                        videoElement.srcObject = stream;
                      }
                    }}
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button type="button" onClick={handleCaptureImage} variant="default">
                    Chụp ảnh
                  </Button>
                  <Button type="button" onClick={handleCloseCamera} variant="outline">
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenCamera}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Mở camera
                  </Button>

                  <div>
                    <Input
                      id="face-image"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("face-image")?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Tải ảnh lên
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Vui lòng cung cấp ảnh khuôn mặt rõ ràng (JPG hoặc PNG, tối đa 5MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || !isFormValid()}>
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang xử lý...
              </>
            ) : (
              "Thêm người dùng"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}