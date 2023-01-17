import { defineVitConfig } from '@zardoy/vit'

export default defineVitConfig({
    root: './src/remote-control',
    envDir: __dirname,
    build: {
        outDir: '../../dist-remote-ui'
    },
    server: {
        port: 3700,
        open: false,
    },
})
