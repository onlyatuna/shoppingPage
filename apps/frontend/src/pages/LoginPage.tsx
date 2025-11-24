import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const onSubmit = async (data: any) => {
        try {
            const res = await apiClient.post('/auth/login', data);
            const { token, user } = res.data.data;

            // 更新 Zustand Store
            login(token, user);

            navigate('/'); // 導回首頁
        } catch (error) {
            alert('登入失敗，請檢查帳號密碼');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">會員登入</h2>

                <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                        {...register('email')}
                        type="email"
                        className="w-full border p-2 rounded"
                        defaultValue="test@example.com"
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-2">Password</label>
                    <input
                        {...register('password')}
                        type="password"
                        className="w-full border p-2 rounded"
                        defaultValue="password123"
                    />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    登入
                </button>
            </form>
        </div>
    );
}