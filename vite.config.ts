import { defineConfig } from 'vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'

console.log(process.env)

export default defineConfig({
    root: './src/react',
    plugins: [
        viteExternalsPlugin({
            electron: 'electron',
        }),
    ],
    server: {
        port: 3500,
        open: false,
    },
})
