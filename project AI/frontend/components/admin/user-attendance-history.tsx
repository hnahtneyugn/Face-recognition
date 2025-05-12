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
  Calendar,
  ArrowLeft,
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
import { format, getYear } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa kiểu trạng thái điểm danh
type AttendanceStatus = "on-time" | "late" | "rejected" | "pending";

// Định nghĩa kiểu dữ liệu bản ghi điểm danh, khớp với backend
type AttendanceRecord = {
  attendance_id: string;
  date: string;
  time: string;
  status: AttendanceStatus;
};

// Định nghĩa props cho component
interface UserAttendanceHistoryProps {
  userId: string;
  userName: string;
}

export default function UserAttendanceHistory({
  userId,
  userName,
}: UserAttendanceHistoryProps) {
  // State để lưu danh sách bản ghi điểm danh
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    []
  );
  // State để quản lý trạng thái loading
  const [isLoading, setIsLoading] = useState(true);
  // State để lưu bộ lọc ngày
  const [dateFilter, setDateFilter] = useState<string>("");
  // State để lưu bộ lọc tháng
  const [monthFilter, setMonthFilter] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  // State để lưu bộ lọc năm
  const [yearFilter, setYearFilter] = useState<string>(
    getYear(new Date()).toString()
  );
  // State để lưu loại bộ lọc (ngày, tháng, năm)
  const [filterType, setFilterType] = useState<"day" | "month" | "year">(
    "month"
  );
  // Hook để điều hướng
  const router = useRouter();
  // Hook để hiển thị thông báo
  const { toast } = useToast();

  // Tải lịch sử điểm danh khi userId hoặc bộ lọc thay đổi
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      const token = localStorage.getItem("auth_token");
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
        // Chuẩn bị query parameters dựa trên loại bộ lọc
        const queryParams = new URLSearchParams();
        if (filterType === "day" && dateFilter) {
          const [year, month, day] = dateFilter.split("-").map(Number);
          queryParams.append("year", year.toString());
          queryParams.append("month", month.toString());
          queryParams.append("day", day.toString());
        } else if (filterType === "month" && monthFilter) {
          const [year, month] = monthFilter.split("-").map(Number);
          queryParams.append("year", year.toString());
          queryParams.append("month", month.toString());
        } else if (filterType === "year" && yearFilter) {
          queryParams.append("year", yearFilter);
        }

        // Gọi API để lấy lịch sử điểm danh
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
          }/admins/attendance/${userId}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("auth_token");
            throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          }
          if (response.status === 404) {
            throw new Error("Không tìm thấy người dùng hoặc dữ liệu điểm danh");
          }
          throw new Error("Lỗi khi tải lịch sử điểm danh");
        }

        const data = await response.json();
        // Chuyển đổi attendance_id thành string để khớp với type
        setAttendanceRecords(
          data.map((record: any) => ({
            ...record,
            attendance_id: record.attendance_id.toString(),
          }))
        );
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải lịch sử điểm danh",
          variant: "destructive",
        });
        if (error.message.includes("Phiên đăng nhập hết hạn")) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [userId, filterType, dateFilter, monthFilter, yearFilter, toast, router]);

  // Xử lý thay đổi loại bộ lọc
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as "day" | "month" | "year");
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
  };

  // Xử lý thay đổi tháng
  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
  };

  // Xử lý thay đổi năm
  const handleYearChange = (value: string) => {
    setYearFilter(value);
  };

  // Định dạng ngày hiển thị
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, dd/MM/yyyy", { locale: vi });
  };

  // Tạo danh sách các tháng để lọc (12 tháng gần nhất)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(d, "yyyy-MM");
      const label = format(d, "MM/yyyy");
      options.push({ value, label });
    }
    return options;
  };

  // Tạo danh sách các năm để lọc (5 năm gần nhất)
  const getYearOptions = () => {
    const options = [];
    const currentYear = getYear(new Date());
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
  };

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  // Hiển thị trạng thái điểm danh với icon và màu
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lịch sử điểm danh của {userName}</CardTitle>
            <CardDescription>
              Xem lịch sử điểm danh theo ngày, tháng hoặc năm
            </CardDescription>
          </div>
          <Link href="/admin" passHref>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bộ lọc */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Chọn loại bộ lọc */}
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại bộ lọc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Theo ngày</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
                <SelectItem value="year">Theo năm</SelectItem>
              </SelectContent>
            </Select>

            {/* Bộ lọc theo ngày */}
            {filterType === "day" && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={handleDateChange}
                  className="w-full sm:w-auto"
                />
              </div>
            )}

            {/* Bộ lọc theo tháng */}
            {filterType === "month" && (
              <Select value={monthFilter} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      Tháng {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Bộ lọc theo năm */}
            {filterType === "year" && (
              <Select value={yearFilter} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      Năm {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Hiển thị trạng thái loading */}
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
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy dữ liệu điểm danh
            </div>
          ) : (
            <>
              {/* Bảng hiển thị lịch sử điểm danh */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.attendance_id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.time || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusDisplay(record.status)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Thống kê */}
              <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
                <div>Tổng số: {attendanceRecords.length} bản ghi</div>
                <div>
                  Đúng giờ:{" "}
                  {attendanceRecords.filter((r) => r.status === "on-time").length}{" "}
                  | Muộn:{" "}
                  {attendanceRecords.filter((r) => r.status === "late").length} |{" "}
                  Chưa điểm danh:{" "}
                  {attendanceRecords.filter((r) => r.status === "pending").length}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}