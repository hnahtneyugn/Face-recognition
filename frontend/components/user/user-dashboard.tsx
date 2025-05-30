"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import RealTimeClock from "@/components/user/real-time-clock"
import AttendanceHistory from "@/components/user/attendance-history"
import UserProfile from "@/components/user/user-profile"
import { Camera, Loader2, AlertTriangle, Info, LogOut } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadModels, detectFacesInVideo, verifyUserFace } from "@/lib/face-api"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function UserDashboard() {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [attendanceResult, setAttendanceResult] = useState<{
    success: boolean
    message: string
    timestamp?: string
  } | null>(null)
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [activeTab, setActiveTab] = useState("attendance")
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<{
    user_id: string
    fullname: string
    email: string
    department: string
    face_path: string
  } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [toastShown, setToastShown] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const previousFaceCount = useRef(0)
  const frameCounter = useRef(0)
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null)
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null)
  const stableFrameCount = useRef(0)
  const singleFaceConfirmCount = useRef(0)
  const SINGLE_FACE_CONFIRM_FRAMES = 10 // Số frame liên tiếp cần để xác nhận chỉ còn 1 khuôn mặt

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Lấy thông tin người dùng khi component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoadingUser(true)
      try {
        // Sử dụng API utility để lấy thông tin người dùng
        const data = await api.get('users/');
        setCurrentUser(data)
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserInfo()
  }, [toast])

  // Tải mô hình face-api khi component mount
  useEffect(() => {
    const initFaceApi = async () => {
      setIsLoadingModels(true)
      try {
        await loadModels()
      } catch (error) {
        console.error("Không thể tải mô hình face-api:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải mô hình nhận diện khuôn mặt.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingModels(false)
      }
    }

    initFaceApi()
  }, [toast])

  // Cleanup camera stream khi component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (faceDetectionInterval.current !== null) {
        clearTimeout(faceDetectionInterval.current)
        faceDetectionInterval.current = null
      }
    }
  }, [stream])

  const handleOpenCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })
      setStream(mediaStream)
      setIsCameraOpen(true)
      setAttendanceResult(null)
      setMultipleFacesDetected(false)
      setFaceCount(0)

      if (!canvasRef.current) {
        const canvas = document.createElement("canvas")
        canvas.style.display = "none"
        document.body.appendChild(canvas)
        canvasRef.current = canvas
      }

      // Bắt đầu phát hiện khuôn mặt ngay lập tức thay vì đợi setTimeout
      startFaceDetection()
      console.log("Đã bắt đầu phát hiện khuôn mặt")
    } catch (error) {
      console.error("Lỗi khi mở camera:", error)
      toast({
        title: "Lỗi camera",
        description: "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.",
        variant: "destructive",
      })
    }
  }

  const showWarningToast = (faceCount: number) => {
    if (!toastShown) {
      toast({
        title: "Cảnh báo",
        description: `Phát hiện ${faceCount} khuôn mặt trong khung hình. Vui lòng đảm bảo chỉ có một khuôn mặt.`,
        variant: "destructive",
      })
      setToastShown(true)
    }
  }

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
    setMultipleFacesDetected(false)
    setFaceCount(0)
    setToastShown(false)
    singleFaceConfirmCount.current = 0

    if (faceDetectionInterval.current !== null) {
      clearTimeout(faceDetectionInterval.current)
      faceDetectionInterval.current = null
    }
  }

  const detectFaces = async () => {
    if (!videoRef.current || !stream) return
    const video = videoRef.current
    if (video.readyState !== 4) return

    try {
      const result = await detectFacesInVideo(video)
      const currentFaceCount = result.faceCount

      // Nếu chưa phát hiện nhiều khuôn mặt và hiện tại phát hiện > 1 khuôn mặt
      if (!multipleFacesDetected && currentFaceCount > 1) {
        setMultipleFacesDetected(true)
        setFaceCount(currentFaceCount)
        showWarningToast(currentFaceCount)
        singleFaceConfirmCount.current = 0
        return
      }

      // Nếu đang ở trạng thái nhiều khuôn mặt
      if (multipleFacesDetected) {
        if (currentFaceCount === 1) {
          // Tăng bộ đếm khi phát hiện 1 khuôn mặt
          singleFaceConfirmCount.current += 1

          // Chỉ tắt cảnh báo khi đã xác nhận chắc chắn chỉ còn 1 khuôn mặt
          if (singleFaceConfirmCount.current >= SINGLE_FACE_CONFIRM_FRAMES) {
            setMultipleFacesDetected(false)
            setFaceCount(1)
            setToastShown(false)
            singleFaceConfirmCount.current = 0
          }
        } else {
          // Reset bộ đếm nếu phát hiện lại nhiều khuôn mặt
          singleFaceConfirmCount.current = 0
        }
      }
    } catch (error) {
      console.error("Lỗi khi phát hiện khuôn mặt:", error)
    }
  }

  const startFaceDetection = () => {
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current)
    }

    // Kiểm tra mỗi 200ms
    faceDetectionInterval.current = setInterval(detectFaces, 200)
  }

  const handleCaptureImage = async () => {
    if (!stream || !videoRef.current || !currentUser) return

    setIsProcessing(true)

    try {
      const video = videoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95)
      })

      if (multipleFacesDetected) {
        setAttendanceResult({
          success: false,
          message: `Phát hiện ${faceCount} khuôn mặt trong ảnh. Vui lòng đảm bảo chỉ có khuôn mặt của bạn trong khung hình.`,
        })
        setIsProcessing(false)
        return
      }

      // Sử dụng hàm verifyUserFace từ face-api.ts
      const result = await verifyUserFace(blob);

      setAttendanceResult({
        success: result.success,
        message: result.message,
        timestamp: result.timestamp,
      });

      if (result.success) {
        setRefreshHistory((prev) => prev + 1);
        handleCloseCamera();
      }
    } catch (error: any) {
      setAttendanceResult({
        success: false,
        message: error.message || "Lỗi xử lý. Vui lòng thử lại sau.",
      })
      console.error("Lỗi khi xử lý ảnh:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Xử lý đăng xuất
  const handleLogout = () => {
    // Xóa token trong localStorage
    localStorage.removeItem("auth_token")

    // Xóa token trong cookie
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống",
    })
    router.push("/")
  }

  // Thêm style animation cho overlay cảnh báo
  const overlayStyle = {
    opacity: multipleFacesDetected ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out'
  }

  // Thêm style cho video container
  const videoContainerStyle = {
    transition: 'transform 0.3s ease-in-out',
    transform: isTransitioning ? 'scale(0.99)' : 'scale(1)'
  }

  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Đang tải thông tin người dùng...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Hệ thống điểm danh</h1>
        <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Điểm danh hôm nay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <RealTimeClock />
                </div>

                {attendanceResult && (
                  <Alert
                    variant={attendanceResult.success ? "default" : "destructive"}
                    className={attendanceResult.success ? "bg-green-50 border-green-200" : undefined}
                  >
                    <AlertTitle>{attendanceResult.success ? "Điểm danh thành công" : "Điểm danh thất bại"}</AlertTitle>
                    <AlertDescription>
                      {attendanceResult.message}
                      {attendanceResult.timestamp && (
                        <div className="mt-2 font-medium">Thời gian: {attendanceResult.timestamp}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center">
                  {!isCameraOpen ? (
                    <Button onClick={handleOpenCamera} className="flex items-center gap-2" disabled={isLoadingModels}>
                      {isLoadingModels ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tải mô hình...
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5" />
                          Điểm danh bằng khuôn mặt
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative border rounded-lg overflow-hidden" style={videoContainerStyle}>
                        <video
                          autoPlay
                          playsInline
                          ref={(videoElement) => {
                            if (videoElement && stream) {
                              videoElement.srcObject = stream
                              videoRef.current = videoElement
                              videoElement.onloadeddata = () => {
                                console.log("Video đã load xong và sẵn sàng")
                                startFaceDetection()
                              }
                            }
                          }}
                          className="w-full h-auto"
                          style={{ transform: 'scaleX(-1)' }} // Mirror effect
                        />

                        {multipleFacesDetected && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm ${multipleFacesDetected ? 'pointer-events-auto' : 'pointer-events-none'
                              }`}
                            style={overlayStyle}
                          >
                            <div className="bg-white p-4 rounded-md max-w-xs text-center transform transition-transform duration-300 hover:scale-105">
                              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                              <p className="font-medium text-red-600">Phát hiện {faceCount} khuôn mặt!</p>
                              <p className="text-sm mt-1">Vui lòng đảm bảo chỉ có khuôn mặt của bạn trong khung hình</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={handleCaptureImage}
                          disabled={isProcessing || multipleFacesDetected}
                          variant="default"
                          className={multipleFacesDetected ? "cursor-not-allowed opacity-50" : ""}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            "Chụp ảnh điểm danh"
                          )}
                        </Button>
                        <Button onClick={handleCloseCamera} variant="outline">
                          Hủy
                        </Button>
                      </div>

                      <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Hướng dẫn</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>Đảm bảo khuôn mặt của bạn nằm trong khung hình</li>
                            <li>Đảm bảo ánh sáng đủ sáng và rõ ràng</li>
                            <li>Chỉ có duy nhất khuôn mặt của bạn trong khung hình</li>
                            <li>Không đeo kính râm hoặc che khuôn mặt</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lịch sử điểm danh</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceHistory userId={currentUser.user_id} refreshTrigger={refreshHistory} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <UserProfile user={currentUser} />
        </TabsContent>
      </Tabs>
    </div>
  )
}