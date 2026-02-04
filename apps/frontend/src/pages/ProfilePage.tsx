//ProfilePage.tsx
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Lock, Save } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
    const { user, login } = useAuthStore(); // 為了更新 Store 中的 user info
    const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

    // 1. 取得最新個人資料 (確保資料同步)
    useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await apiClient.get('/users/profile');
            const userData = res.data.data;
            // 設定表單初始值 (reset 會設定 isDirty 為 false)
            reset({
                name: userData.name,
                password: '',
                confirmPassword: ''
            });
            return userData;
        }
    });

    // 2. 更新資料 Mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            // 過濾掉空密碼，不傳送
            const payload: any = { name: data.name };
            if (data.password) payload.password = data.password;

            return apiClient.patch('/users/profile', payload);
        },
        onSuccess: (res) => {
            toast.success('個人資料已更新');
            // 更新 Zustand Store (保持前端狀態一致)
            // 注意：這裡我們假設 token 沒變，只更新 user 物件
            const updatedUser = res.data.data;
            login(updatedUser);

            // 重置表單狀態為 "已同步"，並清空密碼欄位
            reset({
                name: updatedUser.name,
                password: '',
                confirmPassword: ''
            });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || '更新失敗')
    });

    const onSubmit = (data: any) => {
        if (data.password && data.password !== data.confirmPassword) {
            return toast.error('兩次密碼輸入不一致');
        }
        updateProfileMutation.mutate(data);
    };

    return (
        <div className="max-w-xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">編輯個人資料</h1>

            <div className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">{user?.name}</h2>
                        <p className="text-gray-500">{user?.email}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                            {user?.role}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">姓名</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                {...register('name')}
                                className="w-full border pl-10 pr-4 py-2 rounded focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-bold mb-4 text-gray-700">變更密碼 (若不修改請留空)</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">新密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        {...register('password')}
                                        type="password"
                                        placeholder="輸入新密碼"
                                        className="w-full border pl-10 pr-4 py-2 rounded focus:ring-2 focus:ring-black outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">確認新密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        {...register('confirmPassword')}
                                        type="password"
                                        placeholder="再次輸入新密碼"
                                        className="w-full border pl-10 pr-4 py-2 rounded focus:ring-2 focus:ring-black outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isDirty || updateProfileMutation.isPending}
                        className="w-full bg-[#E85D3F] text-white py-2.5 rounded-lg border border-[#22334F] shadow-[4px_4px_0px_#22334F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#22334F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#22334F] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 font-bold"
                    >
                        <Save size={18} />
                        {updateProfileMutation.isPending ? '儲存中...' : '儲存變更'}
                    </button>
                </form>
            </div>
        </div>
    );
}