import { app } from "electron"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export const setStartupOnBoot = async (enabled: boolean): Promise<void> => {
    if (process.platform !== "win32") {
        throw new Error("Startup on boot is only supported on Windows")
    }

    const appName = "FilmoMania Beta"
    const keyName = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`

    try {
        if (enabled) {
            // Add to startup
            const command = `reg add "${keyName}" /v "${appName}" /t REG_SZ /d "${app.getPath('exe')}" /f`
            await execAsync(command)
            console.log("Added FilmoMania to Windows startup")
        } else {
            // Remove from startup
            const command = `reg delete "${keyName}" /v "${appName}" /f`
            await execAsync(command)
            console.log("Removed FilmoMania from Windows startup")
        }
    } catch (error) {
        console.error("Failed to modify startup settings:", error)
        throw new Error(`Failed to ${enabled ? 'add' : 'remove'} from startup: ${error}`)
    }
}

export const isStartupEnabled = async (): Promise<boolean> => {
    if (process.platform !== "win32") {
        return false
    }

    const appName = "FilmoMania Beta"
    const keyName = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`

    try {
        const command = `reg query "${keyName}" /v "${appName}"`
        await execAsync(command)
        return true
    } catch {
        return false
    }
}
