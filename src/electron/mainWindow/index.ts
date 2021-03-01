import { BrowserWindow } from "electron";
import electronIsDev from "electron-is-dev";
import windowStateKeeper from "electron-window-state";
import _ from "lodash";
import path from "path";

export let mainWindow: BrowserWindow | null;

export const createMainWindow = () => {
    // todo electron general cmd: --fullscreen (<-- boolean) --settingsFile "path_to_file" --mergeSettings
    // --navigateTo "url e.g.: /settings /film/{filmID} /film/{filmID}/download?path=path_to_save&OPTIONS /film/{filmID}/play?player=path_to_exec /search/film_keywords?FILTERS"
    //
    // todo command usage on electron apps. for this one: --hidden (<-- download or play without opening filmomania)
    // todo make a lot of bots for auto. choco-n--- deploy
    // todo add fullscreenable to electron general settings

    // todo manage update on resize and move if is in development
    const windowState = windowStateKeeper({
        defaultWidth: 700,
        defaultHeight: 400
    });
    // todo is that mandatory?
    const windowPosAndSize = _.pick(windowState, ["x", "y", "width", "height"]);

    mainWindow = new BrowserWindow({
        ...windowPosAndSize,
        minWidth: 800,
        minHeight: 600,
        center: true,
        // todo change it
        backgroundColor: "#000",
        darkTheme: true,
        alwaysOnTop: electronIsDev && (!!+process.env.WINDOW_ALWAYS_ON_TOP! ?? false),
        webPreferences: {
            nodeIntegration: true,
            devTools: true
        },
    });
    // todo-high
    if (electronIsDev) mainWindow.minimize();
    windowState.manage(mainWindow);
    // mainWindow.setMenu(null);
    void mainWindow.loadURL(electronIsDev ? "http://localhost:3500" : `file://${path.join(__dirname, "../../../build/index.html")}`);

    mainWindow.on("closed", () => mainWindow = null);
};
