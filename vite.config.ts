import { defineVitConfig } from '@zardoy/vit'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default defineVitConfig({
    root: './src/react',
    envDir: __dirname,
    plugins: [
        viteExternalsPlugin({
            electron: 'electron',
        }),
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
