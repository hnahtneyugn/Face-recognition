"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Trash2,
  MoreVertical,
  UserCog,
  User,
  Shield,
  Search,
  Building,
  History,
} from "lucide-react";
import EditUserDialog from "@/components/admin/edit-user-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
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
import { api } from "@/lib/api"; // Import our new API utility

// Định nghĩa kiểu vai trò người dùng
type UserRole = "user" | "admin";

// Định nghĩa kiểu dữ liệu người dùng, khớp với backend
type UserType = {
  user_id: number;
  fullname: string;
  email: string;
  role: UserRole;
  department: string;
  face_path?: string;
};

export default function UserList() {
  // State để lưu danh sách người dùng gốc (không lọc)
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  // State để lưu danh sách người dùng đã lọc
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  // State để quản lý trạng thái loading ban đầu
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // State để quản lý trạng thái loading khi tìm kiếm
  const [isSearching, setIsSearching] = useState(false);
  // State để lưu người dùng đang chỉnh sửa
  const [userToEdit, setUserToEdit] = useState<UserType | null>(null);
  // State để lưu từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  // State để lưu bộ lọc phòng ban
  const [departmentFilter, setDepartmentFilter] = useState("all");
  // State để lưu bộ lọc vai trò
  const [roleFilter, setRoleFilter] = useState("all");
  // State để hiển thị dialog xác nhận thay đổi vai trò
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  // State để lưu thông tin thay đổi vai trò
  const [roleChangeInfo, setRoleChangeInfo] = useState<{
    user_id: number;
    userName: string;
    currentRole: UserRole;
    newRole: UserRole;
  } | null>(null);
  // State để hiển thị dialog xác nhận xóa
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // State để lưu người dùng cần xóa
  const [userToDelete, setUserToDelete] = useState<{
    user_id: number;
    name: string;
  } | null>(null);
  // Hook để hiển thị thông báo
  const { toast } = useToast();
  // Hook để điều hướng
  const router = useRouter();

  // Tải danh sách người dùng khi component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsInitialLoading(true);
      try {
        const data = await api.get<UserType[]>('admins/');
        setAllUsers(data);
        setFilteredUsers(data);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách người dùng",
          variant: "destructive",
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Xử lý tìm kiếm khi gõ
  useEffect(() => {
    const filtered = allUsers.filter((user) => {
      const matchesSearch = searchTerm === "" ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesDepartment && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, departmentFilter, roleFilter, allUsers]);

  // Xử lý khi nhấn Enter để tìm kiếm trên server
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setIsSearching(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("fullname", searchTerm);
        queryParams.append("email", searchTerm);
        if (departmentFilter !== "all") queryParams.append("department", departmentFilter);
        if (roleFilter !== "all") queryParams.append("role", roleFilter);

        const data = await api.get<UserType[]>(`admins/?${queryParams.toString()}`);
        if (data.length === 0) {
          toast({
            title: "Không tìm thấy",
            description: "Không tìm thấy người dùng nào phù hợp với từ khóa tìm kiếm",
            variant: "destructive",
          });
        } else {
          setAllUsers(data);
          setFilteredUsers(data);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tìm kiếm người dùng",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Mở dialog chỉnh sửa người dùng
  const handleEditUser = (user: UserType) => {
    setUserToEdit(user);
  };

  // Mở dialog xác nhận xóa người dùng
  const handleDeleteUser = (userId: number, userName: string) => {
    setUserToDelete({ user_id: userId, name: userName });
    setShowDeleteDialog(true);
  };

  // Xác nhận xóa người dùng
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Sử dụng API utility để xóa người dùng
      await api.delete(`admins/${userToDelete.user_id}`);

      // Cập nhật state sau khi xóa
      setAllUsers(allUsers.filter((user) => user.user_id !== userToDelete.user_id));
      setFilteredUsers(filteredUsers.filter((user) => user.user_id !== userToDelete.user_id));
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa người dùng",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  // Mở dialog xác nhận thay đổi vai trò
  const handleToggleRole = (
    userId: number,
    userName: string,
    currentRole: UserRole
  ) => {
    const newRole = currentRole === "user" ? "admin" : "user";
    setRoleChangeInfo({
      user_id: userId,
      userName,
      currentRole,
      newRole,
    });
    setShowRoleChangeDialog(true);
  };

  // Xác nhận thay đổi vai trò
  const confirmRoleChange = async () => {
    if (!roleChangeInfo) return;

    const { user_id, newRole } = roleChangeInfo;
    setShowRoleChangeDialog(false);

    try {
      // Sử dụng API utility để thay đổi vai trò người dùng
      await api.put(`admins/${user_id}`, { role: newRole });

      // Cập nhật state sau khi thay đổi vai trò
      setAllUsers(
        allUsers.map((user) =>
          user.user_id === user_id ? { ...user, role: newRole } : user
        )
      );
      setFilteredUsers(
        filteredUsers.map((user) =>
          user.user_id === user_id ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò người dùng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật vai trò người dùng",
        variant: "destructive",
      });
    } finally {
      setRoleChangeInfo(null);
    }
  };

  // Xử lý khi người dùng được cập nhật từ EditUserDialog
  const handleUserUpdated = (updatedUser: UserType) => {
    setAllUsers(
      allUsers.map((user) =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );
    setFilteredUsers(
      filteredUsers.map((user) =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );
    setUserToEdit(null);
    toast({
      title: "Thành công",
      description: "Đã cập nhật thông tin người dùng",
    });
  };

  // Xử lý thay đổi từ khóa tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Điều hướng đến trang lịch sử điểm danh
  const handleViewAttendanceHistory = (userId: number, userName: string) => {
    router.push(
      `/admin/user-attendance/${userId}?name=${encodeURIComponent(userName)}`
    );
  };

  // Lấy danh sách phòng ban từ danh sách người dùng
  const departments = Array.from(
    new Set(allUsers.map((user) => user.department))
  );

  // Hiển thị trạng thái loading chỉ khi lần đầu load trang
  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-8">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thông tin quyền quản trị viên */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1">
          Quyền quản trị viên
        </h3>
        <p className="text-sm text-blue-700">
          Quản trị viên có thể chỉnh sửa thông tin của tất cả người dùng, thêm
          người dùng mới, xóa người dùng, nâng cấp người dùng thường thành quản
          trị viên và hạ cấp quản trị viên thành người dùng thường.
        </p>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Tìm kiếm theo tên hoặc email */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Tìm kiếm theo tên hoặc email... (Nhấn Enter để tìm kiếm trên server)"
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-2.5">
              <svg
                className="animate-spin h-4 w-4 text-gray-500"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Lọc theo phòng ban */}
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Lọc theo vai trò */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="admin">Quản trị viên</SelectItem>
            <SelectItem value="user">Người dùng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500"
                >
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.face_path ? (
                        <img
                          src={user.face_path || "/placeholder.svg"}
                          alt={user.fullname}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder.svg")
                          }
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      {user.fullname}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{user.department}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === "admin" ? (
                        <>
                          <Shield className="h-4 w-4 text-purple-500" />
                          <span className="text-purple-600">Quản trị viên</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600">Người dùng</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Mở menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        {user.role !== "admin" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewAttendanceHistory(
                                user.user_id,
                                user.fullname
                              )
                            }
                          >
                            <History className="mr-2 h-4 w-4" />
                            <span>Lịch sử điểm danh</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteUser(user.user_id, user.fullname)
                          }
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Xóa</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog chỉnh sửa người dùng */}
      {userToEdit && (
        <EditUserDialog
          user={userToEdit}
          onClose={() => setUserToEdit(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Dialog xác nhận thay đổi vai trò */}
      <AlertDialog
        open={showRoleChangeDialog}
        onOpenChange={setShowRoleChangeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChangeInfo?.currentRole === "user"
                ? `Bạn có chắc chắn muốn nâng cấp "${roleChangeInfo?.userName}" từ Người dùng thành Quản trị viên không?`
                : `Bạn có chắc chắn muốn hạ cấp "${roleChangeInfo?.userName}" từ Quản trị viên thành Người dùng không?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận xóa người dùng */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng "{userToDelete?.name}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}