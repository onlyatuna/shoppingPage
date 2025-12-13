import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

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
            console.error('Instagram API Error:', error.response?.data || error.message);
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
                console.log('Image uploaded to Cloudinary:', targetUrl);
            }

            // Step 1: Create Media Container
            const containerResponse = await axios.post(`https://graph.instagram.com/${igUserId}/media`, null, {
                params: {
                    image_url: targetUrl,
                    caption: caption,
                    access_token: token
                }
            });

            const creationId = containerResponse.data.id;
            console.log('Container created:', creationId);



            // Step 2: Wait for Media Processing with exponential backoff
            const maxAttempts = 20; // Increased from 10
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
                    console.log(`Media status(${attempt} / ${maxAttempts}): ${statusCode}`);

                    if (statusCode === 'FINISHED') {
                        console.log('Media ready! Publishing...');

                        // Step 3: Publish Media
                        const publishResponse = await axios.post(`https://graph.instagram.com/${igUserId}/media_publish`, null, {
                            params: {
                                creation_id: creationId,
                                access_token: token
                            }
                        });

                        console.log('Successfully published! Media ID:', publishResponse.data.id);
                        return publishResponse.data.id;

                    } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
                        throw new Error(`Media processing failed with status: ${statusCode}`);
                    }

                    // Still IN_PROGRESS, continue loop

                } catch (error: any) {
                    // Log error but continue trying unless it's the last attempt
                    console.warn(`Error on attempt ${attempt}:`, error.message);

                    if (attempt >= maxAttempts) {
                        throw new Error('媒體處理超時，請稍後再試或檢查圖片格式');
                    }
                }
            }

            throw new Error('媒體處理超時，請稍後再試或檢查圖片格式');

        } catch (error: any) {
            console.error('Instagram Publish Error:', error.response?.data || error.message);
            throw new Error('Failed to publish to Instagram: ' + (error.response?.data?.error?.message || error.message));
        }
    }
}
