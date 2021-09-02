// import { SettingType } from "./settings";
import { SettingType } from "./settings";
import { TorrentEngineParseResult } from "./TorrentTypes";

declare module "typed-ipc" {
    interface IpcMainEvents {
        retryProxySetup: null

        playTorrent: {
            player: SettingType<"player", "defaultPlayer">
            magnet: string
        }

        downloadAndOpenTorrentFile: {
            torrentFileUrl: string
        }
    }

    interface IpcMainRequests {
        torrentsList: {
            variables: {
                searchQuery: string
            }

            response: {
                metdata: {
                    engines: string[]
                    warnings: ("TOO_MANY_RESULTS")[]
                },
                parseResult: TorrentEngineParseResult
            }
        }
    }

    interface IpcRendererEvents {
        updateSodaPlayerInstallationState: {
            stage: "downloading",
            progress: number//0-1
            downloadedBytes: number
        } | {
            stage: "installing"
        } | {
            stage: "patching"
        } | {
            stage: "done"
            patched: boolean
        }

        openRoute: {
            url: string
        }

        // events could be seen in bottom right corner
        showEvent: {
            type: "proxy"
            message: string
        }

        proxySetup: {
            success: boolean
            errorMessage?: string
        }
    }
}
