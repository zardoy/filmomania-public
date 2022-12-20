import { TorrentEngineParseResult } from "./TorrentTypes";

declare module "typed-ipc" {
    interface IpcMainEvents {
        playTorrent: {
            magnet: string
            data: PlayerInputData
            nativeOpen?: boolean
        }

        downloadTorrentFile: {
            torrentFileUrl: string
        }

        openSettingsFile: {}
        stremioServerStatus: {}
        startStremioServer: {}
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
        test: {}
        getStremioStreamingLink: {
            variables: {
                magnet: string,
            }
            response: string
        }
    }

    interface IpcRendererEvents {
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
        stremioServerStatus: {
            up: boolean,
        }
    }
}

export interface PlayerInputData {
    playbackName: string,
    /** In seconds */
    startTime?: number
}
