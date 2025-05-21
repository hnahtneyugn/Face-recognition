"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, UserPlus, CalendarCheck, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddUserForm from "@/components/admin/add-user-form";
import { useRouter } from "next/navigation";

// Giả định UserList là một component riêng, sẽ tích hợp với GET /admins/
import UserList from "@/components/admin/user-list";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập lại",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [toast, router]);

  // Xử lý đăng xuất
  const handleLogout = () => {
    // Xóa token trong localStorage
    localStorage.removeItem("auth_token");
    
    // Xóa token trong cookie
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống",
    });
    router.push("/");
  };

  // Xử lý khi người dùng được thêm thành công
  const handleUserAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("users");
    toast({
      title: "Thành công",
      description: "Người dùng đã được thêm và danh sách đã được làm mới",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Quản lý hệ thống</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" passHref>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Xem điểm danh hôm nay
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Danh sách người dùng
          </TabsTrigger>
          <TabsTrigger value="add-user" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Thêm người dùng mới
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserList key={refreshTrigger} />
        </TabsContent>

        <TabsContent value="add-user">
          <AddUserForm onUserAdded={handleUserAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}