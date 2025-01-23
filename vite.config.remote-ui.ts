import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    root: './src/remote-control',
    envDir: __dirname,
    build: {
        outDir: '../../dist-remote-ui'
    },
    plugins: [
        react()
    ],
    server: {
        port: 3700,
        open: false,
    },
})
