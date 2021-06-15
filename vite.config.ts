import { builtinModules } from "module";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    root: "src/react",
    resolve: {
        alias: [{
            find: "electron",
            replacement: path.join(__dirname, "src/react/electron.ts"),
        }]
    },
    build: {
        rollupOptions: {
            external: builtinModules
        }
    },
    optimizeDeps: {
        exclude: builtinModules,
        esbuildOptions: {

        }
    },
    server: {
        port: 3500,
        open: false
    }
});
