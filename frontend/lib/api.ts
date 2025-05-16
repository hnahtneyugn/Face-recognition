/**
 * API utility functions for communicating with the backend
 */

// Base URL for API calls - either the environment variable or the default backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Debug log for API base URL
console.log('API_BASE_URL:', API_BASE_URL);

// Generic fetch function with authentication and error handling
export async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // Prepare headers with authentication if token exists
  const headers: HeadersInit = {};
  
  // Nếu là FormData (có files), không thêm Content-Type để browser tự xử lý
  if (!options.body || !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Thêm token nếu có
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Kết hợp với headers từ options nếu có
  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };

  try {
    // Construct the full URL - if using the proxy, it will be '/api/...'
    // If using direct connection, it will be 'http://localhost:8000/...'
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log(`Sending ${options.method || 'GET'} request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });

    console.log(`Response status: ${response.status}`);

    // Handle unauthorized responses
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
      }
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }

    // Handle other non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorDetail;
      try {
        const errorData = JSON.parse(errorText);
        errorDetail = errorData.detail;
      } catch (parseError) {
        errorDetail = errorText || 'Có lỗi xảy ra khi kết nối đến máy chủ';
      }
      
      throw new Error(errorDetail);
    }

    // Parse JSON response safely
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    try {
      const data = responseText ? JSON.parse(responseText) : {};
      return data as T;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Return empty object if response is empty or can't be parsed
      return {} as T;
    }
  } catch (error: any) {
    console.error('API request failed:', error);
    // Đảm bảo chỉ throw Error object, không phải object khác
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(typeof error === 'string' ? error : 'Có lỗi xảy ra khi kết nối đến máy chủ');
    }
  }
}

// Simplified API methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => 
    fetchAPI<T>(endpoint, { method: 'GET', ...options }),
  
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    fetchAPI<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
  
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    fetchAPI<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
  
  delete: <T = any>(endpoint: string, options?: RequestInit) => 
    fetchAPI<T>(endpoint, { method: 'DELETE', ...options }),

  // For form data (with files) - POST
  postForm: <T = any>(endpoint: string, formData: FormData, options?: RequestInit) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Sử dụng fetch trực tiếp thay vì fetchAPI để kiểm soát tốt hơn
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log(`Sending FormData POST request to: ${url}`);
    
    return new Promise<T>(async (resolve, reject) => {
      try {
        const response = await fetch(url, { 
          method: 'POST',
          body: formData,
          headers: {
            // Không đặt Content-Type cho FormData
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options?.headers,
          },
          ...options
        });
        
        console.log(`Response status: ${response.status}`);
        
        // Handle unauthorized responses
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
          }
          reject(new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'));
          return;
        }
        
        // Handle other non-200 responses
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          let errorDetail;
          try {
            const errorData = JSON.parse(errorText);
            errorDetail = errorData.detail;
          } catch (parseError) {
            errorDetail = errorText || 'Có lỗi xảy ra khi kết nối đến máy chủ';
          }
          
          reject(new Error(errorDetail));
          return;
        }
        
        // Parse JSON response safely
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        try {
          const data = responseText ? JSON.parse(responseText) : {};
          resolve(data as T);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Return empty object if response is empty or can't be parsed
          resolve({} as T);
        }
      } catch (error: any) {
        console.error('API request failed:', error);
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error(typeof error === 'string' ? error : 'Có lỗi xảy ra khi kết nối đến máy chủ'));
        }
      }
    });
  },
  
  // For form data (with files) - PUT 
  putForm: <T = any>(endpoint: string, formData: FormData, options?: RequestInit) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Sử dụng fetch trực tiếp thay vì fetchAPI để kiểm soát tốt hơn
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log(`Sending FormData PUT request to: ${url}`);
    
    // Log request headers for debugging
    const headers = {
      // Không đặt Content-Type cho FormData
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };
    console.log('Request headers:', headers);
    
    return new Promise<T>(async (resolve, reject) => {
      try {
        const response = await fetch(url, { 
          method: 'PUT',
          body: formData,
          headers,
          ...options
        });
        
        console.log(`Response status: ${response.status}`);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
        // Handle unauthorized responses
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
          }
          reject(new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'));
          return;
        }
        
        // Handle other non-200 responses
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          let errorDetail;
          try {
            const errorData = JSON.parse(errorText);
            errorDetail = errorData.detail || JSON.stringify(errorData);
          } catch (parseError) {
            errorDetail = errorText || `Có lỗi HTTP ${response.status} khi kết nối đến máy chủ`;
          }
          
          reject(new Error(errorDetail));
          return;
        }
        
        // Parse JSON response safely
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        try {
          const data = responseText ? JSON.parse(responseText) : {};
          resolve(data as T);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Return empty object if response is empty or can't be parsed
          resolve({} as T);
        }
      } catch (error: any) {
        console.error('API request failed:', error);
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error(typeof error === 'string' ? error : 'Có lỗi xảy ra khi kết nối đến máy chủ'));
        }
      }
    });
  }
}; 