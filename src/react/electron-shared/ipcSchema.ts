import { SettingType } from "./settings";
import { TorrentEngineParseResult } from "./torrentTypes";

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

        playTorrent: {
            player: SettingType<"player", "defaultPlayer">;
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

        // should be internal
        getStoredSettingValue: {
            variables: {
                path: string;
            };

            response: {
                value: any;
            };
        };

        setStoredSettingValue: {
            variables: {
                path: string;
                newValue: any;
            };
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

        // events could be seen in bottom right corner
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
