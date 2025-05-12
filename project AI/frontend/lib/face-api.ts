// Thư viện face-api.js để phát hiện và nhận diện khuôn mặt
import * as faceapi from "face-api.js";

// Biến để theo dõi trạng thái tải mô hình
let modelsLoaded = false;
let isLoading = false;

// Đường dẫn đến các mô hình
const MODEL_URL = "/models";

// Hàm tải các mô hình cần thiết cho nhận diện khuôn mặt
export async function loadModels(): Promise<void> {
  if (modelsLoaded || isLoading) return;

  try {
    isLoading = true;

    // Tải các mô hình: phát hiện khuôn mặt và đặc điểm khuôn mặt
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    modelsLoaded = true;
    console.log("Face-api models loaded successfully");
  } catch (error) {
    console.error("Error loading face-api models:", error);
    throw new Error("Không thể tải mô hình nhận diện khuôn mặt");
  } finally {
    isLoading = false;
  }
}

// Hàm phát hiện khuôn mặt trong video
export async function detectFacesInVideo(
  videoElement: HTMLVideoElement
): Promise<{
  faceCount: number;
  detections: faceapi.WithFaceLandmarks<{
    detection: faceapi.FaceDetection;
  }>[];
}> {
  if (!modelsLoaded) {
    await loadModels();
  }

  try {
    // Sử dụng TinyFaceDetector để phát hiện khuôn mặt
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    return {
      faceCount: detections.length,
      detections,
    };
  } catch (error) {
    console.error("Error detecting faces:", error);
    return { faceCount: 0, detections: [] };
  }
}

// Hàm xác minh khuôn mặt người dùng và gửi điểm danh
export async function verifyUserFace(
  imageBlob: Blob
): Promise<{
  success: boolean;
  message: string;
  faceCount: number;
  timestamp?: string;
}> {
  if (!modelsLoaded) {
    try {
      await loadModels();
    } catch (error) {
      return {
        success: false,
        message: "Không thể tải mô hình nhận diện khuôn mặt",
        faceCount: 0,
      };
    }
  }

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return {
        success: false,
        message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        faceCount: 0,
      };
    }

    // Phát hiện khuôn mặt trong ảnh đầu vào
    const inputImg = await createImageFromBlob(imageBlob);
    const inputDetections = await faceapi
      .detectAllFaces(inputImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    // Kiểm tra số lượng khuôn mặt
    if (inputDetections.length === 0) {
      return {
        success: false,
        message: "Không phát hiện khuôn mặt trong ảnh. Vui lòng thử lại.",
        faceCount: 0,
      };
    }
    if (inputDetections.length > 1) {
      return {
        success: false,
        message: `Phát hiện ${inputDetections.length} khuôn mặt trong ảnh. Vui lòng đảm bảo chỉ có một khuôn mặt trong khung hình.`,
        faceCount: inputDetections.length,
      };
    }

    // Gửi ảnh đến backend để điểm danh
    const formData = new FormData();
    formData.append("face_image", imageBlob, "face.jpg");

    const response = await fetch("http://localhost:8000/users/attendance", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Lỗi khi điểm danh");
    }

    return {
      success: true,
      message: "Điểm danh thành công!",
      faceCount: 1,
      timestamp: result.time,
    };
  } catch (error: any) {
    console.error("Error verifying face:", error);
    return {
      success: false,
      message: error.message || "Đã xảy ra lỗi khi xử lý ảnh. Vui lòng thử lại.",
      faceCount: 0,
    };
  }
}

// Hàm tạo đối tượng Image từ Blob
async function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Tránh lỗi CORS
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(blob);
  });
}