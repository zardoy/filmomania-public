import { autoUpdater } from "electron-updater"
import { settingsStore } from "../react/electron-shared/settings"
import electronLogger from "electron-log"

export const initAutoUpdater = () => {
    if (settingsStore.settings.core.autoUpdate) {
        // Configure auto-updater
        autoUpdater.disableWebInstaller = true
        autoUpdater.allowDowngrade = true
        autoUpdater.logger = electronLogger

        // Set update server URL (GitHub releases)
        autoUpdater.setFeedURL({
            provider: "github",
            owner: "zardoy",
            repo: "filmomania-public",
            private: false,
            releaseType: "release"
        })

        electronLogger.info("Auto updater enabled", {
            currentVersion: autoUpdater.currentVersion,
            feedURL: autoUpdater.getFeedURL()
        })

        // Check for updates
        autoUpdater.checkForUpdates().then(result => {
            if (result?.isUpdateAvailable) {
                electronLogger.info("Update found", {
                    updateInfo: result.updateInfo,
                    version: result.updateInfo.version
                })

                // Auto download the update
                autoUpdater.downloadUpdate()
            } else {
                electronLogger.info("No updates available")
            }
        }).catch(error => {
            electronLogger.error("Failed to check for updates", error)
        })

        // Set up event listeners
        autoUpdater.on("update-available", info => {
            electronLogger.info("Update available", info)
        })

        autoUpdater.on("update-not-available", info => {
            electronLogger.info("Update not available", info)
        })

        autoUpdater.on("error", err => {
            electronLogger.error("Auto updater error", err)
        })

        autoUpdater.on("download-progress", progressObj => {
            electronLogger.info("Download progress", progressObj)
        })

        autoUpdater.on("update-downloaded", info => {
            electronLogger.info("Update downloaded", info)
            // Quit and install on next app launch
            autoUpdater.quitAndInstall()
        })
    } else {
        electronLogger.info("Auto updater disabled by user settings")
    }
}

export const checkForUpdates = () => {
    if (settingsStore.settings.core.autoUpdate) {
        electronLogger.info("Manual update check requested")
        return autoUpdater.checkForUpdates()
    } else {
        electronLogger.info("Cannot check for updates - auto updater is disabled")
        return Promise.reject(new Error("Auto updater is disabled"))
    }
}
