import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.png'],
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
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 // 4 MiB
            }
        })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
                    'lucide-vendor': ['lucide-react'],
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'framer-vendor': ['framer-motion'],
                }
            }
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true, // 允許從 Docker 外部存取
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000', // 後端的位址
                changeOrigin: true,
            }
        }
    }
})