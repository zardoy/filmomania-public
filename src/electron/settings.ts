import electronSettings from "electron-settings";
import { typedIpcMain } from "typed-ipc";

import { SettingsSchema } from "../react/electron-shared/settingsSchema";

export const getAppSetting = async <S extends keyof SettingsSchema, N extends keyof SettingsSchema[S]>(
    scope: S,
    name: string
): Promise<string | undefined> => await electronSettings.get([scope, name] as [string, string]) as any;

export const bindIPC = () => {
    typedIpcMain.addEventListener("setSetting", async (_event, { scope, name, newValue }) => {
        electronSettings.setSync([scope, name], newValue);
    });
};
