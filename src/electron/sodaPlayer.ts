import child_process from "child_process";
import { app } from "electron";
import execa from "execa";
import fs from "fs";
import got, { Progress } from "got";
import path from "path";
import rifraf from "rimraf";
import { patchSodaPlayer, sodaPlayerBasicConfig } from "soda-player-patch";
import { getPaths } from "soda-player-patch/build/patchElectronApp";
import stream from "stream";
import { typedIpcMain } from "typed-ipc";
import util from "util";

import { settingsStore } from "../react/electron-shared/settings";
import { mainWindow } from "./mainWindow";

const pipeline = util.promisify(stream.pipeline);

// orMac, linux not supported
const isWin = process.platform === "win32";

// todo-high add irl tests with checksum
const sodaPlayerDownloadUrl = `https://www.sodaplayer.com/${isWin ? "win" : "mac"}/download`;

export const sodaPlayerExecPath = path.join(process.env.LOCALAPPDATA || "", "sodaplayer/Soda Player.exe");

export const isSodaPlayerInstalled = (): boolean =>
    fs.existsSync(sodaPlayerExecPath);

export const installOrAndPatchSodaPlayer = async () => {
    if (!isSodaPlayerInstalled()) {
        const sodaPlayerSavePath = path.join(app.getPath("temp"), "filmomania-soda-player.exe");

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
    }
    typedIpcMain.sendToWindow(mainWindow, "updateSodaPlayerInstallationState", {
        stage: "patching"
    });
    let patched = false;
    try {
        await patchSodaPlayer();
        patched = true;
    } catch (err) {
        console.error(err);
        // something went wrong while patching. try to restore original version
        const { oldAsarSource, asarUnpacked, asarSource } = await getPaths(sodaPlayerBasicConfig.localAppdataDir);
        // throw fix ipc
        // patch was complete (but probably something broke)
        if (fs.existsSync(oldAsarSource)) {
            if (fs.existsSync(asarUnpacked)) {
                rifraf.sync(asarUnpacked);
            }
            await fs.promises.rename(oldAsarSource, asarSource);
        }
    }
    typedIpcMain.sendToWindow(mainWindow, "updateSodaPlayerInstallationState", {
        stage: "done",
        patched
    });
};

export const playWithSodaPlayer = async (magnet: string) => {
    console.log("run", isSodaPlayerInstalled(), settingsStore.get("generalDefaultPlayer"));
    if (!isSodaPlayerInstalled()) return;
    const defaultPlayer = settingsStore.get("generalDefaultPlayer") as string;
    // todo-high check arg
    // todo-very-high
    child_process.spawn(sodaPlayerExecPath, [magnet, ...defaultPlayer === "sodaPlayerPatched" ? ["--fullscreen"] : []], {
        detached: true,
        stdio: "ignore"
    });
};
