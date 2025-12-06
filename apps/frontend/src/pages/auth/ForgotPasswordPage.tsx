import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

const forgotPasswordSchema = z.object({
  email: z.string().email('請輸入有效的 Email 地址'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await apiClient.post('/auth/request-password-reset', data);
      setIsSubmitted(true);
      toast.success('重設密碼連結已發送至您的信箱');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '發送失敗，請稍後再試');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">郵件已發送</h2>
          <p className="text-gray-600 mb-6">
            如果該信箱存在於我們的系統中，您將收到一封包含重設密碼連結的郵件。
          </p>
          <p className="text-sm text-gray-500 mb-6">
            請檢查您的收件匣（包括垃圾郵件資料夾）
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            返回登入頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-4">
            <Mail size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">忘記密碼？</h2>
          <p className="text-sm text-gray-500 mt-2">
            輸入您的 Email，我們將發送重設密碼連結給您
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
                發送中...
              </>
            ) : (
              '發送重設連結'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-gray-600 hover:text-gray-900 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            返回登入
          </button>
        </form>
      </div>
    </div>
  );
}
