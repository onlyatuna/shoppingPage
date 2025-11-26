import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
import apiClient from '../api/client';

// 1. 定義前端驗證規則 (包含確認密碼)
const registerSchema = z.object({
    name: z.string().min(2, '名字至少需要 2 個字元'),
    email: z.string().email('Email 格式不正確'),
    password: z.string().min(6, '密碼長度至少需要 6 個字元'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "兩次輸入的密碼不一致",
    path: ["confirmPassword"], // 錯誤訊息顯示在 confirmPassword 欄位下
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        try {
            // 呼叫後端 API
            // 注意：後端不需要 confirmPassword，所以只傳需要的欄位
            await apiClient.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password
            });

            toast.success('註冊成功！請登入');

            // 註冊成功後，導向登入頁面
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || '註冊失敗，請稍後再試');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-4">
                        <UserPlus size={24} />
                    </div>
                    <h2 className="text-2xl font-bold">註冊會員</h2>
                    <p className="text-gray-500 text-sm mt-2">加入我們，開始購物之旅</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* 名字 */}
                    <div>
                        <label className="block text-sm font-medium mb-1">姓名</label>
                        <input
                            {...register('name')}
                            type="text"
                            placeholder="王小明"
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="name@example.com"
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* 密碼 */}
                    <div>
                        <label className="block text-sm font-medium mb-1">密碼</label>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="至少 6 個字元"
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* 確認密碼 */}
                    <div>
                        <label className="block text-sm font-medium mb-1">確認密碼</label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="再次輸入密碼"
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> 註冊中...
                            </>
                        ) : (
                            '立即註冊'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    已經有帳號了嗎？{' '}
                    <Link to="/login" className="text-black font-bold hover:underline">
                        立即登入
                    </Link>
                </div>
            </div>
        </div>
    );
}