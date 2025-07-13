import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [Vue()],
    build: {
        outDir: 'chrome-cookie-sharing-plugin',
        rollupOptions: {
            input: {
                background: path.resolve(__dirname, 'background.js'),
                popup: path.resolve(__dirname, 'index.html'),
            },
            output: {
                entryFileNames: '[name].js',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
})
