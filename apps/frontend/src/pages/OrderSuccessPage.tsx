import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import CheckoutProgress from '../components/CheckoutProgress';

export default function OrderSuccessPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <CheckoutProgress step={3} />
            <div className="bg-green-100 p-6 rounded-full mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-4">訂單建立成功！</h1>
            <p className="text-gray-600 mb-2 text-lg">感謝您的訂購，我們會盡快為您安排出貨。</p>
            <p className="text-gray-500 mb-8 font-mono bg-gray-100 px-4 py-2 rounded">
                訂單編號：#{id}
            </p>

            <div className="flex gap-4">
                <Link
                    to="/orders"
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    查看訂單
                </Link>
                <Link
                    to="/"
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    繼續購物
                </Link>
            </div>
        </div>
    );
}
