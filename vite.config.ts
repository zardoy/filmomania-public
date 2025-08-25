import { viteExternalsPlugin } from 'vite-plugin-externals'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

// Read version from package.json or environment variable
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = process.env.APP_VERSION || packageJson.version

export default defineConfig({
    root: './src/react',
    base: './',
    envDir: __dirname,
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
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
