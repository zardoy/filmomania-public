import { app, dialog, shell } from "electron";
import unhandled from "electron-unhandled";
import { mainWindow } from "./mainWindow";

export const silentAllErrors = { value: false, }

export class GracefulError extends Error {
    constructor(message, public title?: string) {
        super(message);
    }
}

const oldProcessOn = process.on
//@ts-ignore
process.on = (event, listener) => {
    if (event !== "unhandledRejection" && event !== "uncaughtException") {
        oldProcessOn.call(process, event, listener)
        return
    }

    const handler = async error => {
        // todo still need to display in ui, e.g. window without taking focus
        if (silentAllErrors.value) {
            console.error(error)
            return
        }
        if (error instanceof GracefulError) {
            await dialog.showMessageBox(mainWindow!, {
                type: "error",
                message: error.title || "Error",
                detail: error.message,
            })
            return
        }
        listener(error)
    };
    oldProcessOn.call(process, event, handler)
    // initialization error, kill the app
    if (mainWindow === null) app.quit()
}

unhandled({
    showDialog: true,
    reportButton: error => {
        void shell.openExternal(`${process.env.GITHUB_REPO_URL!}/issues/new?body=${error.stack}`);
    }
});

process.on = oldProcessOn
