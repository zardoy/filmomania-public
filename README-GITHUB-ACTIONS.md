# GitHub Actions Build Workflow

This repository includes a GitHub Actions workflow that automatically builds FilmoMania for both Windows and macOS on every push to the `dev` branch.

## What it does

### Build Jobs
1. **Windows Build** (`build-windows`)
   - Runs on Windows Server (latest)
   - Builds a Windows executable (.exe) using NSIS installer
   - Architecture: x64

2. **macOS Build** (`build-macos`)
   - Runs on macOS (latest)
   - Builds a macOS disk image (.dmg)
   - Architecture: ARM64 (Apple Silicon M1/M2)

3. **Release Job** (`release`)
   - Runs only on pushes to `dev` branch (not PRs)
   - Creates a GitHub release with both artifacts
   - Tags the release with version + build number

### Build Process
Each build job follows these steps:
1. **Setup Environment**
   - Checkout code
   - Setup Node.js 18
   - Setup pnpm with caching for faster builds

2. **Install & Build**
   - Install dependencies with `pnpm install --frozen-lockfile`
   - Build the app with `pnpm run build-app` (builds main, renderer, and remote-control-ui)
   - Build platform-specific executable with electron-builder

3. **Upload Artifacts**
   - Upload build artifacts for the release job
   - Artifacts are retained for 30 days

### Release Details
- **Release Name**: `FilmoMania Beta v{version} (Dev Build #{run_number})`
- **Tag Format**: `v{version}-dev-{run_number}`
- **Release Type**: Prerelease (development build)
- **Assets**:
  - `FilmoMania-Beta-{version}-Windows.exe`
  - `FilmoMania-Beta-{version}-macOS-ARM64.dmg`

## Available Scripts

The workflow uses these npm scripts from `package.json`:

- `build-app`: Complete application build (main + renderer + remote-ui)
- `electron-pack-win`: Build Windows executable
- `electron-pack-mac`: Build macOS DMG

## Requirements

### For Windows builds:
- Windows runner (GitHub-hosted)
- electron-builder with NSIS target

### For macOS builds:
- macOS runner (GitHub-hosted)
- electron-builder with DMG target
- ARM64 architecture (Apple Silicon)

## Triggering Builds

### Automatic triggers:
- Push to `dev` branch → Full build + release
- Pull request to `dev` branch → Build only (no release)

### Manual trigger:
You can also manually trigger the workflow from the GitHub Actions tab.

## Build Outputs

After a successful build, you'll find:

1. **Artifacts** (available for 30 days):
   - In the Actions tab under each workflow run
   - Separate artifacts for Windows and macOS

2. **Releases** (permanent):
   - In the GitHub Releases section
   - Only created for pushes to `dev` branch
   - Contains both Windows and macOS binaries

## Notes

- The workflow uses pnpm for package management with caching for faster builds
- Build artifacts include the complete FilmoMania application with all features:
  - Main Electron app
  - React frontend
  - Remote control web UI
  - Torrent/magnet playing functionality
  - QR code remote access
- Windows builds target x64 architecture
- macOS builds target ARM64 (Apple Silicon) only
- All builds are marked as prerelease/development builds
