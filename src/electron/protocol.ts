import { app, } from "electron"
import { settingsStore } from "../react/electron-shared/settings"
import { typedIpcMain } from "typed-ipc"
import { mainWindow } from "./mainWindow"
import {Registry} from 'rage-edit';

const nativeProtocol = "filmomania";
export const registerProtocol = () => {
    const magnetProtocol = settingsStore.settings.core['handleMagnetProtocolName'] || "magnet";
    if (!settingsStore.settings.core['registerFilmomania']) {
        app.setAsDefaultProtocolClient(nativeProtocol, process.execPath, [__filename])
    }
    if (settingsStore.settings.core.handleMagnetProtocol) {
        registerMagnetProtocol(magnetProtocol)
    } else {
        app.removeAsDefaultProtocolClient(magnetProtocol)
    }
    app.on("second-instance", (_e, argv) => {
        handleArgv(argv)
    })
}

const registerMagnetProtocol = (protocol = 'magnet') => {
    const registered = app.setAsDefaultProtocolClient(protocol, process.execPath, [__filename])
    console.log("Registered magnet protocol", registered)
    if(process.platform === 'win32') {
        (async () => {
            const appName = 'filmomania-public';

            await Registry.set('HKCU\\Software\\' + appName + '\\Capabilities', 'ApplicationName', appName);
            await Registry.set('HKCU\\Software\\' + appName + '\\Capabilities', 'ApplicationDescription', appName);

            await Registry.set('HKCU\\Software\\' + appName + '\\Capabilities\\URLAssociations', protocol, appName + '.' + protocol);

            await Registry.set('HKCU\\Software\\Classes\\' + appName + '.' + protocol + '\\DefaultIcon', '', process.execPath);

            await Registry.set('HKCU\\Software\\Classes\\' + appName + '.' + protocol + '\\shell\\open\\command', '', `"${process.execPath}" "%1"`);

            await Registry.set('HKCU\\Software\\RegisteredApplications', appName, 'Software\\' + appName + '\\Capabilities');
            console.log('Magnet protocol registered in Windows registry');
        })();
    }
}

export const handleArgv = (argv: string[] | undefined) => {
    argv ??= process.argv
    const protocolStart = `${nativeProtocol}://`;
    const openAction = argv.find(x => x.startsWith(protocolStart))
    const magnetAction = argv.find(x => x.startsWith("magnet:"))
    if (openAction) {
        const route = openAction.slice(`${protocolStart}`.length)
        typedIpcMain.sendToWindow(mainWindow!, "openRoute", { url: route })
    }
    if (magnetAction) {
        typedIpcMain.sendToWindow(mainWindow!, "playManget", { magnet: magnetAction })
            mainWindow!.focus()
    }
}
