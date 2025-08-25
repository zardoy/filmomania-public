import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Read version from package.json or environment variable
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = process.env.APP_VERSION || packageJson.version

export default defineConfig({
    root: './src/remote-control',
    envDir: __dirname,
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
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
