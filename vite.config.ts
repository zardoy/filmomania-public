import { viteExternalsPlugin } from 'vite-plugin-externals'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    root: './src/react',
    base: './',
    envDir: __dirname,
    plugins: [
        viteExternalsPlugin({
            electron: 'electron',
        }),
        react()
    ],
    build: {
        target: 'chrome108',
        outDir: '../../dist'
    },
    server: {
        port: 3500,
        strictPort: true,
        open: false,
    },
})
