import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { sanitizeLog, sanitizeImageUrl, sanitizePrompt } from '../utils/securityUtils';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export interface InstagramPost {
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    timestamp: string;
}

export class InstagramService {
    private static readonly IG_API_URL = 'https://graph.instagram.com/me/media';
    private static readonly IG_FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';

    static async getPosts(limit: number = 12): Promise<InstagramPost[]> {
        const token = process.env.IG_ACCESS_TOKEN;

        if (!token) {
            throw new Error('IG_ACCESS_TOKEN is not configured');
        }

        try {
            const response = await axios.get(this.IG_API_URL, {
                params: {
                    fields: this.IG_FIELDS,
                    access_token: token,
                    limit: limit
                }
            });

            return response.data.data;
        } catch (error: any) {
            console.error('Instagram API Error:', sanitizeLog(error.response?.data || error.message));
            throw new Error('Failed to fetch Instagram posts');
        }
    }

    static async publishPost(imageUrl: string, caption: string): Promise<string> {
        const token = process.env.IG_ACCESS_TOKEN;
        const igUserId = process.env.IG_USER_ID;

        if (!token || !igUserId) {
            throw new Error('IG_ACCESS_TOKEN or IG_USER_ID is not configured');
        }

        try {
            const safeCaption = sanitizePrompt(caption, 2000); // Instagram limit is ~2200
            let targetUrl = imageUrl;

            // 如果是 Base64 格式，先上傳到 Cloudinary 轉成公開連結
            if (imageUrl.startsWith('data:')) {
                console.log('Uploading Base64 image to Cloudinary...');
                if (!process.env.CLOUDINARY_CLOUD_NAME) {
                    throw new Error('Cloudinary not configured. Cannot upload Base64 image.');
                }

                const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                    folder: 'instagram-publish-temp',
                });
                targetUrl = uploadResult.secure_url;
                console.log('Image uploaded to Cloudinary:', sanitizeLog(targetUrl));
            } else {
                // [SECURITY] 針對外部 URL 進行 SSRF 驗證
                const { host, pathname, search, port, isLocal } = sanitizeImageUrl(imageUrl);
                const protocol = isLocal ? 'http:' : 'https:';
                // 使用樣板字串重建 URL 以徹底打破 Taint 追蹤 (CodeQL Pattern)
                targetUrl = `${protocol}//${host}${port}${pathname}${search}`;
                console.log('Sanitized external URL:', sanitizeLog(targetUrl));
            }

            // Step 1: Create Media Container
            const containerResponse = await axios.post(`https://graph.instagram.com/${igUserId}/media`, null, {
                params: {
                    image_url: targetUrl,
                    caption: safeCaption,
                    access_token: token
                }
            });

            const creationId = containerResponse.data.id;
            console.log('Container created:', sanitizeLog(creationId));

            // Step 2: Wait for Media Processing with exponential backoff
            const maxAttempts = 20;
            let attempt = 0;

            while (attempt < maxAttempts) {
                attempt++;

                // Exponential backoff: start at 3s, increase by 1s each attempt, max 10s
                const delay = Math.min(3000 + (attempt * 1000), 10000);
                console.log(`Waiting ${delay}ms before checking (attempt ${attempt}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                try {
                    const statusResponse = await axios.get(`https://graph.instagram.com/${creationId}`, {
                        params: {
                            fields: 'status_code,status',
                            access_token: token
                        }
                    });

                    const statusCode = statusResponse.data.status_code;
                    console.log(`Media status(${attempt} / ${maxAttempts}): ${sanitizeLog(statusCode)}`);

                    if (statusCode === 'FINISHED') {
                        console.log('Media ready! Publishing...');

                        // Step 3: Publish Media
                        const publishResponse = await axios.post(`https://graph.instagram.com/${igUserId}/media_publish`, null, {
                            params: {
                                creation_id: creationId,
                                access_token: token
                            }
                        });

                        console.log('Successfully published! Media ID:', sanitizeLog(publishResponse.data.id));
                        return publishResponse.data.id;

                    } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
                        throw new Error(`Media processing failed with status: ${statusCode}`);
                    }

                    // Still IN_PROGRESS, continue loop

                } catch (error: any) {
                    console.warn(`Error on attempt ${attempt}:`, sanitizeLog(error.message));
                    if (attempt >= maxAttempts) {
                        throw new Error('媒體處理超時，請稍後再試或檢查圖片格式');
                    }
                }
            }

            throw new Error('媒體處理超時，請稍後再試或檢查圖片格式');

        } catch (error: any) {
            console.error('Instagram Publish Error:', sanitizeLog(error.response?.data || error.message));
            throw new Error('Failed to publish to Instagram: ' + (error.response?.data?.error?.message || error.message));
        }
    }
}
