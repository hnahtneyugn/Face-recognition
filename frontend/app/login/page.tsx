import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập hệ thống</h1>
        <LoginForm />
      </div>
    </div>
  );
} 