import { BrowserWindow } from "electron";
import electronIsDev from "electron-is-dev";
import ElectronWindowKeeper from "electron-window-keeper";
import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"

export let mainWindow: BrowserWindow | null;

export const createMainWindow = () => {
    // todo electron general cmd: --fullscreen (<-- boolean) --settingsFile "path_to_file" --mergeSettings
    // --navigateTo "url e.g.: /settings /film/{filmID} /film/{filmID}/download?path=path_to_save&OPTIONS /film/{filmID}/play?player=path_to_exec /search/film_keywords?FILTERS"
    //
    // todo command usage on electron apps. for this one: --hidden (<-- download or play without opening filmomania)
    // todo make a lot of bots for auto. choco-n--- deploy
    // todo add fullscreenable to electron general settings

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
        show: false
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
    windowState.manage(mainWindow);
    if (electronIsDev) {
        mainWindow.showInactive();
    }

    mainWindow.setMenu(null);
    void mainWindow.loadURL(electronIsDev ? "http://localhost:3500" : getFileFromPublic("index.html"));

    mainWindow.on("closed", () => mainWindow = null);
};
