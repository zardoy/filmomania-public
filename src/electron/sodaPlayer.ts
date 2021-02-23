import { app } from "electron";
import execa from "execa";
import fs from "fs";
import got, { Progress } from "got";
import path from "path";
import stream from "stream";
import { typedIpcMain } from "typed-ipc";
import util from "util";

import { mainWindow } from "./mainWindow";

const pipeline = util.promisify(stream.pipeline);

// orMac, linux not supported
const isWin = process.platform === "win32";

// todo-high add irl tests with checksum
const sodaPlayerDownloadUrl = `https://www.sodaplayer.com/${isWin ? "win" : "mac"}/download`;

export const sodaPlayerExecPath = path.join(process.env.LOCALAPPDATA || "", "sodaplyer/Soda Player.exe");

export const isSodaPlayerInstalled = (): boolean =>
    fs.existsSync(sodaPlayerExecPath);

export const bindIPCEvents = () => {
    const sodaPlayerSavePath = path.join(app.getPath("temp"), "filmomania-soda-player.exe");

    typedIpcMain.addEventListener("installSodaPlayer", async () => {
        if (process.platform !== "win32") {
            //todo-moderate
            throw new Error("Only win");
        }

        await pipeline(
            got.stream(sodaPlayerDownloadUrl)
                .on("downloadProgress", (progress: Progress) => {
                    typedIpcMain.sendToWindow(mainWindow, "updateSodaPlayerInstallationState", {
                        stage: "downloading",
                        progress: progress.percent,
                        downloadedBytes: progress.transferred
                    });
                }),
            fs.createWriteStream(sodaPlayerSavePath)
        );

        typedIpcMain.sendToWindow(mainWindow, "updateSodaPlayerInstallationState", {
            stage: "installing"
        });
        await execa(sodaPlayerSavePath, ["/s"]);
        // todo-moderate
        fs.unlinkSync(sodaPlayerSavePath);
        // todo modernaze
        typedIpcMain.sendToWindow(mainWindow, "updateSodaPlayerInstallationState", {
            stage: "installed"
        });
    });
};
