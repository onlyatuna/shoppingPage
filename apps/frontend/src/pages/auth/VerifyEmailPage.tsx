import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import apiClient from '../../api/client';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('無效的驗證連結');
      return;
    }

    // 呼叫後端驗證 API
    apiClient.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        toast.success('驗證成功！');
        // 3秒後跳轉登入頁
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
        const message = err.response?.data?.message || '驗證失敗，連結可能已過期';
        setErrorMessage(message);
        toast.error(message);
      });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">正在驗證您的信箱...</h2>
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
            <p className="text-gray-500 text-sm mt-4">請稍候，這只需要幾秒鐘</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">驗證成功！🎉</h2>
            <p className="text-gray-600 mb-6">您的帳號已成功啟用，現在可以登入使用了</p>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                立即登入
              </button>
              <p className="text-sm text-gray-500">將在 3 秒後自動跳轉...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
              <XCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">驗證失敗</h2>
            <p className="text-gray-600 mb-2">{errorMessage}</p>
            <p className="text-sm text-gray-500 mb-6">請確認連結是否正確，或聯繫客服協助</p>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                返回登入頁
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                回到首頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}