export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  users: {
    profile: '/users/profile',
    update: '/users/update',
  },
  admins: {
    dashboard: '/admins/dashboard',
  },
} as const; 