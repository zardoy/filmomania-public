import { main } from '@zardoy/electron-esbuild'

await main({
    mode: 'production',
    outdir: 'build',
})
// TODO download server file!
