import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.ts',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                id: '/',
                name: 'Study Timetable',
                short_name: 'Timetable',
                description: 'Manage your university schedule and attendance',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                categories: ['education', 'productivity', 'utilities'],
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ],
                screenshots: [
                    {
                        src: 'screenshot-mobile.png',
                        sizes: '1080x1920',
                        type: 'image/png',
                        form_factor: 'narrow'
                    },
                    {
                        src: 'screenshot-desktop.png',
                        sizes: '1920x1080',
                        type: 'image/png',
                        form_factor: 'wide'
                    }
                ],
                shortcuts: [
                    {
                        name: 'View Timetable',
                        short_name: 'Timetable',
                        description: 'View your daily schedule',
                        url: '/timetable',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    },
                    {
                        name: 'Check Attendance',
                        short_name: 'Attendance',
                        description: 'Check your attendance status',
                        url: '/attendance',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    }
                ]
            },
            devOptions: {
                enabled: true,
                type: 'module',
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
