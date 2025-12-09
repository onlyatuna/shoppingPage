import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../api/client';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, '密碼至少需要 6 個字元'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifyStatus, setVerifyStatus] = useState<'verifying' | 'valid' | 'invalid'>('verifying');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setVerifyStatus('invalid');
      return;
    }

    // 驗證 token 是否有效
    apiClient
      .get(`/auth/verify-reset-token?token=${token}`)
      .then(() => {
        setVerifyStatus('valid');
      })
      .catch((err) => {
        console.error(err);
        setVerifyStatus('invalid');
        toast.error(err.response?.data?.message || '重設連結無效或已過期');
      });
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
      toast.success('密碼重設成功！');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '重設失敗，請稍後再試');
    }
  };

  // 驗證中
  if (verifyStatus === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">驗證連結中...</h2>
          <p className="text-gray-500 text-sm mt-2">請稍候</p>
        </div>
      </div>
    );
  }

  // 連結無效
  if (verifyStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">連結無效</h2>
          <p className="text-gray-600 mb-6">
            此重設密碼連結無效或已過期，請重新申請。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              重新申請
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              返回登入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 重設成功
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">密碼重設成功！</h2>
          <p className="text-gray-600 mb-6">您現在可以使用新密碼登入了</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            前往登入
          </button>
          <p className="text-sm text-gray-500 mt-4">將在 3 秒後自動跳轉...</p>
        </div>
      </div>
    );
  }

  // 重設密碼表單
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">設定新密碼</h2>
          <p className="text-sm text-gray-500 mt-2">請輸入您的新密碼</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              {...register('password')}
              type="password"
              placeholder="新密碼"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="確認新密碼"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                重設中...
              </>
            ) : (
              '重設密碼'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
