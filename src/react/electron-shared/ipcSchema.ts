import { TorrentEngineParseResult } from "./TorrentTypes";

declare module "typed-ipc" {
    interface IpcMainEvents {
        playTorrent: {
            magnet: string
            nativeOpen?: boolean
        }

        downloadTorrentFile: {
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
        setupProxy: {}
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
