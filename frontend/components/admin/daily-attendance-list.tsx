"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Calendar,
  Building,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type AttendanceStatus = "on-time" | "late" | "rejected" | "pending";

type AttendanceRecord = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  department: string;
  date: string;
  time: string;
  status: AttendanceStatus;
};

export default function DailyAttendanceList() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDailyAttendance = async () => {
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

      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
          }/attendance/daily?date=${selectedDate}&user_name=${encodeURIComponent(
            searchTerm
          )}&department=${encodeURIComponent(
            departmentFilter === "all" ? "" : departmentFilter
          )}&status=${encodeURIComponent(
            statusFilter === "all" ? "" : statusFilter
          )}`,
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
          throw new Error("Lỗi khi tải dữ liệu điểm danh");
        }

        const data = await response.json();
        setAttendanceRecords(data);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu điểm danh",
          variant: "destructive",
        });
        if (error.message.includes("Phiên đăng nhập hết hạn")) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyAttendance();
  }, [selectedDate, searchTerm, departmentFilter, statusFilter, toast, router]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
  };

  const handleViewUserAttendance = (userId: string, userName: string) => {
    router.push(
      `/admin/attendance/${userId}?name=${encodeURIComponent(userName)}`
    );
  };

  const departments = Array.from(
    new Set(attendanceRecords.map((record) => record.department))
  );

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all" || record.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusDisplay = (status: AttendanceStatus) => {
    switch (status) {
      case "on-time":
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Đúng giờ</span>
          </>
        );
      case "late":
        return (
          <>
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-amber-600">Muộn</span>
          </>
        );
      case "rejected":
        return (
          <>
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Từ chối</span>
          </>
        );
      case "pending":
        return (
          <>
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Chưa điểm danh</span>
          </>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách điểm danh</CardTitle>
        <CardDescription>
          Xem danh sách điểm danh của tất cả nhân viên trong ngày{" "}
          {selectedDate ? formatDate(selectedDate) : "hôm nay"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full sm:w-auto"
              />
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <Select
                value={departmentFilter}
                onValueChange={handleDepartmentFilterChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
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

              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="on-time">Đúng giờ</SelectItem>
                  <SelectItem value="late">Muộn</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="pending">Chưa điểm danh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên nhân viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-gray-500"
                      >
                        Không tìm thấy dữ liệu điểm danh
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">
                          {record.user_name}
                        </TableCell>
                        <TableCell>{record.user_email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span>{record.department}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.time || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusDisplay(record.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewUserAttendance(
                                record.user_id,
                                record.user_name
                              )
                            }
                            className="flex items-center gap-1"
                          >
                            <History className="h-4 w-4" />
                            <span>Lịch sử</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
            <div>Tổng số: {filteredRecords.length} nhân viên</div>
            <div>
              Đúng giờ:{" "}
              {filteredRecords.filter((r) => r.status === "on-time").length} | Muộn:{" "}
              {filteredRecords.filter((r) => r.status === "late").length} | Chưa
              điểm danh:{" "}
              {filteredRecords.filter((r) => r.status === "pending").length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}