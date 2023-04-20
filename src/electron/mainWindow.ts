import { app, BrowserWindow } from "electron";
import electronIsDev from "electron-is-dev";
import ElectronWindowKeeper from "electron-window-keeper";
import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"
import { silentAllErrors } from "./handleErrors";

export let mainWindow: BrowserWindow | null;

export const createMainWindow = () => {
    // todo command usage on electron apps. for this one: --hidden (<-- download or play without opening filmomania)

    // todo manage update on resize and move if is in development
    const windowState = new ElectronWindowKeeper({
        maximized: electronIsDev ? false : {
            default: true
        }
    });

    mainWindow = new BrowserWindow({
        width: 700,
        height: 400,
        ...windowState.restoredState,
        minWidth: 800,
        minHeight: 600,
        center: true,
        // todo change it
        backgroundColor: "#000",
        darkTheme: true,
        // alwaysOnTop: electronIsDev && (!!+process.env.WINDOW_ALWAYS_ON_TOP! ?? false),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false,
        title: app.getName()
    });
    if (electronIsDev) {
        // otherwise devtools getting focused
        const windowStateDevtools = new ElectronWindowKeeper({
            fileName: "devtools-window-state"
        })
        const devTools = new BrowserWindow({
            ...windowStateDevtools.restoredFullState,
            show: false,
        })

        mainWindow.webContents.setDevToolsWebContents(devTools.webContents)
        mainWindow.webContents.openDevTools({ mode: "detach", activate: false })
        windowStateDevtools.manage(devTools)
        devTools.showInactive()
    } else {
        mainWindow.show()
    }
    mainWindow.on("close", () => {
        app.quit()
    })
    windowState.manage(mainWindow);
    if (electronIsDev) {
        mainWindow.showInactive();
    }

    mainWindow.on("focus", () => {
        silentAllErrors.value = false
    })
    mainWindow.on("blur", () => {
        // first of all it was done to not be annoying while player is playing, but also not need to annoy when something bad is happened while window wasnt focused
        silentAllErrors.value = true
    })

    mainWindow.setMenu(null);
    void mainWindow.loadURL(electronIsDev ? "http://localhost:3500" : `file:///${getFileFromPublic("index.html")}`);

    mainWindow.on("closed", () => mainWindow = null);
};
