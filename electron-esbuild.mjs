//@ts-check
import gitRemoteOriginUrl from "git-remote-origin-url"

import { build } from "esbuild"

/** @type {"dev" | "prod" | "prod-min"} */
const mode = process.argv[2] || "dev";

const NODE_ENV = mode === "dev" ? "development" : "production";

let githubIssuesUrl = await gitRemoteOriginUrl()

if (githubIssuesUrl.endsWith(".git")) githubIssuesUrl = githubIssuesUrl.slice(0, -".git".length);

const result = await build({
    bundle: true,
    // watch: mode === "dev",
    minify: mode === "prod-min",
    define: {
        "process.env.NODE_ENV": `"${NODE_ENV}"`,
        "process.env.GITHUB_ISSUES_URL": `"${githubIssuesUrl}/issues"`
    },
    entryPoints: [
        "src/electron/index.ts"
    ],
    external: [
        "electron",
        "original-fs"
    ],
    platform: "node",
    outfile: "electron-out/index.js",
    metafile: true
})
