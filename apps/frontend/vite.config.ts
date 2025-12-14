import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'Shop App',
                short_name: 'Shop',
                description: 'Build your own shop',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone', // This is key for "no address bar"
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon.svg',
                        sizes: 'any', // SVG works for any size
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000', // 後端的位址
                changeOrigin: true,
            }
        }
    }
})