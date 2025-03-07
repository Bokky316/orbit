import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@features': path.resolve(__dirname, 'src/features'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@layouts': path.resolve(__dirname, 'src/layouts'),
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@styles': path.resolve(__dirname, 'src/styles'),
            '@redux': path.resolve(__dirname, 'src/redux'), // 이 부분이 올바르게 설정되었는지 확인
            '@assets': path.resolve(__dirname, 'src/assets'),
        },
        dedupe: ['date-fns'],
    },
    optimizeDeps: {
        include: [
            'date-fns/*',
            '@emotion/react',
            '@emotion/styled',
            '@mui/icons-material',
            '@mui/material',
            '@mui/x-date-pickers',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-bold',
            '@tiptap/extension-italic',
            '@tiptap/extension-underline',
            '@tiptap/extension-code',
            '@tiptap/extension-link',
            '@tiptap/extension-bullet-list',
            '@tiptap/extension-ordered-list',
            '@tiptap/extension-list-item',
            '@tiptap/extension-blockquote',
            '@tiptap/extension-code-block',
            '@tiptap/extension-horizontal-rule',
            '@tiptap/extension-image',
            '@tiptap/extension-history',
        ],
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    define: {
        global: 'window',
    }
})
