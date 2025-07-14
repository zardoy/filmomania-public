# 🎞️ FILMOMANIA

The project is basically done.

## Build EXE

> [Node.js](https://nodejs.org/) and pnpm (`npm i -g pnpm`) must be installed.

- Clone this via git / download ZIP
- Install dependencies (just run `pnpm i` in terminal) and then run `pnpm build-app`
- If everything is okay, you will find installer in `release` folder

## macOS Installation

If you get "app is damaged" error on macOS:

### Option 1: Quick Fix

```bash
# Run this in Terminal after downloading the app
xattr -cr "/Applications/FilmoMania Beta.app"
```

### Option 2: Use the provided script

```bash
# Make the script executable and run it
chmod +x scripts/fix-macos-app.sh
./scripts/fix-macos-app.sh
```

### Option 3: Manual steps

1. Right-click the app → "Open"
2. Click "Open" in the security dialog
3. Or go to System Preferences → Security & Privacy → "Allow anyway"

### Option 4: Disable Gatekeeper (not recommended)

```bash
sudo spctl --master-disable
```

## Features

- Fast and stable
- Good & modern UI / UX
- Probably no alternatives for now
- Integrated stremio client + integration with mpv (remote control)
- And even more good surprises inside!

You can look at screenshots in docs-assets directory.

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
