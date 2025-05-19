"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format, getYear } from "date-fns"
import { vi } from "date-fns/locale"
import { api } from "@/lib/api" // Import API utility

type AttendanceStatus = "on_time" | "late" | "pending" | "rejected"

type AttendanceRecord = {
  attendance_id: string
  date: string
  time: string | null
  status: AttendanceStatus
}

interface AttendanceHistoryProps {
  userId: string
  refreshTrigger?: number
}

export default function AttendanceHistory({ userId, refreshTrigger = 0 }: AttendanceHistoryProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilterInput, setDateFilterInput] = useState<string>("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), "yyyy-MM"))
  const [yearFilter, setYearFilter] = useState<string>(getYear(new Date()).toString())
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("month")

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        setIsLoading(true)

        // Xác định các tham số truy vấn dựa trên bộ lọc
        let params: Record<string, any> = {}

        if (filterType === "day" && dateFilter) {
          const date = new Date(dateFilter)
          params = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          }
        } else if (filterType === "month" && monthFilter) {
          const [year, month] = monthFilter.split("-").map(Number)
          params = {
            year,
            month,
          }
        } else if (filterType === "year" && yearFilter) {
          params = {
            year: parseInt(yearFilter),
          }
        }

        // Tạo query string từ params
        const queryString = new URLSearchParams(params).toString()

        // Sử dụng API utility để gọi API
        const data = await api.get<AttendanceRecord[]>(
          `users/attendance${queryString ? `?${queryString}` : ``}`
        );
        
        setAttendanceRecords(data)
      } catch (error) {
        console.error("Lỗi khi tải lịch sử điểm danh:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendanceHistory()
  }, [userId, refreshTrigger, filterType, dateFilter, monthFilter, yearFilter])

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as "day" | "month" | "year")
    
    // Reset date filter when changing filter type
    if (value === "day") {
      setDateFilterInput("");
      setDateFilter("");
    }
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFilterInput(value);
    
    // Chỉ xử lý khi có giá trị
    if (!value) {
      setDateFilter("");
      return;
    }

    // Kiểm tra xem giá trị có phải là ngày hợp lệ không
    const date = new Date(value);
    const isValidDate = date instanceof Date && !isNaN(date.getTime());
    
    // Chỉ set filter khi là ngày hợp lệ
    if (isValidDate) {
      setDateFilter(value);
    }
  }
  
  const handleDateInputBlur = () => {
    // No need to update filter here anymore
  }
  
  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // No need to update filter here anymore
  }

  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
  }

  const handleYearChange = (value: string) => {
    setYearFilter(value);
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, dd/MM/yyyy", { locale: vi })
  }

  // Tạo danh sách các tháng để lọc (12 tháng gần nhất)
  const getMonthOptions = () => {
    const options = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = format(d, "yyyy-MM")
      const label = format(d, "MM/yyyy")
      options.push({ value, label })
    }

    return options
  }

  // Tạo danh sách các năm để lọc (5 năm gần nhất)
  const getYearOptions = () => {
    const options = []
    const currentYear = getYear(new Date())

    for (let i = 0; i < 5; i++) {
      const year = currentYear - i
      options.push({ value: year.toString(), label: year.toString() })
    }

    return options
  }

  const monthOptions = getMonthOptions()
  const yearOptions = getYearOptions()

  const getStatusDisplay = (status: AttendanceStatus) => {
    switch (status) {
      case "on_time":
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Đúng giờ</span>
          </>
        )
      case "late":
        return (
          <>
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-amber-600">Muộn</span>
          </>
        )
      case "rejected":
        return (
          <>
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Từ chối</span>
          </>
        )
      case "pending":
        return (
          <>
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Chưa điểm danh</span>
          </>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Đang tải dữ liệu...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

        {filterType === "day" && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input 
              type="date" 
              value={dateFilterInput} 
              onChange={handleDateInputChange}
              onBlur={handleDateInputBlur}
              onKeyDown={handleDateKeyDown}
              placeholder="YYYY-MM-DD"
              className="w-full sm:w-auto" 
            />
          </div>
        )}

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

      {attendanceRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có dữ liệu điểm danh trong khoảng thời gian này</div>
      ) : (
        <>
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
                  <TableCell>{record.time ? record.time.slice(0, 8) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">{getStatusDisplay(record.status)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
            <div>Tổng số: {attendanceRecords.length} bản ghi</div>
            <div>
              Đúng giờ: {attendanceRecords.filter((r) => r.status === "on_time").length} | Muộn:{" "}
              {attendanceRecords.filter((r) => r.status === "late").length} | Chưa điểm danh:{" "}
              {attendanceRecords.filter((r) => r.status === "pending").length}
            </div>
          </div>
        </>
      )}
    </div>
  )
}