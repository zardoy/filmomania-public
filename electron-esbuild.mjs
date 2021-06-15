//@ts-check
import gitRemoteOriginUrl from "git-remote-origin-url"

import { build } from "esbuild"

/** @type {"dev" | "prod" | "prod-min"} */
const mode = process.argv[2] || "dev";

const NODE_ENV = mode === "dev" ? "development" : "production";

let githubRepoUrl = await gitRemoteOriginUrl()

if (githubRepoUrl.endsWith(".git")) githubRepoUrl = githubRepoUrl.slice(0, -".git".length);

const electronFilePath = "./electron-out/index.js"

const result = await build({
    bundle: true,
    // watch: mode === "dev",
    minify: mode === "prod-min",
    define: {
        "process.env.NODE_ENV": `"${NODE_ENV}"`,
        "process.env.GITHUB_REPO_URL": `"${githubRepoUrl}"`,
    },
    entryPoints: [
        "src/electron/index.ts"
    ],
    external: [
        "electron",
        "original-fs"
    ],
    platform: "node",
    outfile: electronFilePath,
    metafile: true,
})

await build({
    bundle: true,
    entryPoints: [
        "src/electron/preload.ts"
    ],
    external: [
        "electron",
        "original-fs"
    ],
    platform: "node",
    outfile: "./electron-out/preload.js",
})

process.argv[2] = electronFilePath
await import("electron/cli.js");
