import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lấy token xác thực từ cookie - middleware không thể truy cập localStorage
  // Thêm xác thực vào cookie khi đăng nhập thay vì chỉ localStorage
  const token = request.cookies.get('auth_token')?.value
  
  // Nếu đang truy cập trang chính (đăng nhập)
  if (request.nextUrl.pathname === '/') {
    // Nếu đã đăng nhập, điều hướng về trang thích hợp dựa vào role
    if (token) {
      // Kiểm tra role từ localStorage (chỉ có thể truy cập từ client, không phải middleware)
      // Vì vậy hãy để client xử lý việc kiểm tra role sau khi đã xác thực token
      return NextResponse.redirect(new URL('/user', request.url))
    }
    // Nếu chưa đăng nhập, cho phép truy cập trang đăng nhập (trang chính)
    return NextResponse.next()
  }

  // Đối với các trang cần xác thực (/admin, /user)
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/user')) {
    // Nếu chưa đăng nhập, điều hướng về trang đăng nhập
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Nếu đã đăng nhập, cho phép truy cập
    return NextResponse.next()
  }
  
  // Cho phép các yêu cầu khác được xử lý bởi ứng dụng
  return NextResponse.next()
}

// Middleware sẽ được áp dụng cho các đường dẫn sau 
export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
} 