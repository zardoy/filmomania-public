import { TorrentEngineParseResult } from "./TorrentTypes";

export interface FirstLaunchSpecs {
    sodaPlayer: {
        installed: boolean;
        patched: boolean;
    };
    engineNeedsSetup: boolean;
}

declare module "typed-ipc" {
    interface IpcMainEvents {
        installOrAndPatchSodaPlayer: null;
        cancelSodaPlayerDownload: null;

        retryProxySetup: null;

        playInPlayer: {
            player: "sodaPlayer" | "system";
            magnet: string;
        };

        downloadAndOpenTorrentFile: {
            torrentFileUrl: string;
        };
    }

    interface IpcMainRequests {
        appInit: {
            response: {
                isFirstLaunch: false;
            } | {
                isFirstLaunch: true;
                specs: FirstLaunchSpecs;
            };
        };

        torrentsList: {
            variables: {
                searchQuery: string;
            };

            // todo remove error
            response: {
                metdata: {
                    engines: string[];
                    warnings: ("TOO_MANY_RESULTS")[];
                },
                parseResult: TorrentEngineParseResult;
            } | {
                error: string;
            };
        };

        getHelloMessage: {
            response: string;
        };
    }

    interface IpcRendererEvents {
        updateSodaPlayerInstallationState: {
            stage: "downloading",
            progress: number;//0-1
            downloadedBytes: number;
        } | {
            stage: "installing";
        } | {
            stage: "patching";
        } | {
            stage: "done";
            patched: boolean;
        };

        openRoute: {
            url: string;
        };

        // events could be seen in top left corner
        showEvent: {
            type: "proxy";
            message: string;
        };

        proxySetup: {
            success: boolean;
            errorMessage?: string;
        };
    }
}
