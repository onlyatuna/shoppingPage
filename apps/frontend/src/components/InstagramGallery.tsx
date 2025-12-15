import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Instagram, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import { Skeleton } from './ui/Skeleton';

interface InstagramPost {
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    timestamp: string;
}

export default function InstagramGallery() {
    const { data: posts, isLoading, error } = useQuery({
        queryKey: ['instagram-posts'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: InstagramPost[] }>('/instagram/posts');
            return res.data.data;
        },
        retry: 1, // 只重試一次，避免如果沒有 token 一直報錯
    });

    if (error) {
        return null; // 如果出錯 (例如沒設定 token)，直接隱藏不顯示
    }

    return (
        <section className="my-16">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-xl text-white shadow-lg">
                        <Instagram size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Follow Us on Instagram</h2>
                        <p className="text-gray-500 text-sm">@your_brand_official</p>
                    </div>
                </div>
                <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    View Profile <ExternalLink size={16} />
                </a>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-[4px]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {posts?.slice(0, 12).map((post) => (
                        <a
                            key={post.id}
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square block overflow-hidden rounded-[4px] bg-gray-100 border-2 border-[#1B2F4A]"
                        >
                            <img
                                src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                                alt={post.caption || 'Instagram Post'}
                                className="h-full w-full object-cover"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                                <Instagram className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" />
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </section>
    );
}
