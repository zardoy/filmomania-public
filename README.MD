# 🎞️ FILMOMANIA

Project development freezed :( Going to work on it this summer.

<details>
<summary>Screenshots</summary>

![screenshot-main-screen](./docs-assets/screenshot-main-screen.png)
![screenshot-films-search](./docs-assets/screenshot-films-search.png)
![screenshot-torrents-select.png](./docs-assets/screenshot-torrents-select.png)

I know, design is bad. I'll use [arwes](https://playground.arwes.dev/core) in future releases.
</details>

## Build EXE

> [Node.js](https://nodejs.org/) and pnpm (`npm i -g pnpm`) must be installed.

- Clone this via git / download ZIP
- Install dependencies (just run `pnpm i` in terminal) and then run `pnpm build-app`
- If everything is okay, you will find installer in `release` folder

## Features

- Its pretty fast and stable
- Good & modern UI / UX
- Probably no alternatives for now
- And even more good surprises inside!

### Builtin Stremio Defaults

```jsonc
{
    "appPath": "%APPDATA%\\stremio\\stremio-server", // this can be changed in main app settings
    "cacheRoot": "%APPDATA%\\stremio\\stremio-server", // this derived from previous
    "cacheSize": 2147483648, // 2GB
    "btMaxConnections": 55,
    "btHandshakeTimeout": 20000,
    "btRequestTimeout": 4000,
    "btDownloadSpeedSoftLimit": 2621440,
    "btDownloadSpeedHardLimit": 3670016,
    "btMinPeersForStable": 5,
    "remoteHttps": "",
    "localAddonEnabled": false,
    "serverVersion": "4.18.0"
}
```

### Customizability & Extendability

Settings are defined in schema.json (after installation) or in electron-shared/settings.ts in src

## TODO

### Stale

- [ ] investigate other frameworks / solutions: Tauri, [Neutralino](https://neutralino.js.org/docs/#/)
- [ ] Rename project
- [X] A lot of integrations! (hooks file)
- [X] Razer and aura sdk integration (light effects) with player integration (you can do it yourself with hooks file)
- [ ] Movie scenes parser
