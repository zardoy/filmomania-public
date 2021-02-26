import { ExternalModulesInfo } from "./ExternalModule";
import { SettingsSchema } from "./settingsSchema";
import { TorrentEngineParseResult } from "./TorrentTypes";

export type UpdateModuleInfo = Partial<ExternalModulesInfo>;

export interface FirstLaunchSpecs {
    sodaPlayerInstalled: boolean;
}

type SetSettingVariables<S extends keyof SettingsSchema = keyof SettingsSchema, N extends keyof SettingsSchema[S] = keyof SettingsSchema[S]> = {
    scope: S,
    name: N;
    newValue: SettingsSchema[S][N];
};

type GetAppSetting<S extends keyof SettingsSchema = keyof SettingsSchema, N extends keyof SettingsSchema[S] = keyof SettingsSchema[S]> = {
    variables: {
        scope: S,
        name: N;
    },
    data: SettingsSchema[S][N];
};

declare module "typed-ipc" {
    interface IpcMainEvents {
        setupFirstLaunch: {
            defaultPlayerIndex: number;
        };

        installSodaPlayer: null;
        cancelSodaPlayerDownload: null;

        setSetting: {
            scope: keyof SettingsSchema,
            name: string,
            newValue: string;
        };

        retryProxySetup: null;

        playInPlayer: {
            player: "sodaPlayer";
            magnet: string;
        };
    }

    interface IpcMainRequests {
        appInit: {
            data: {
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
            data: {
                metdata: {
                    engines: string[];
                    warnings: ("TOO_MANY_RESULTS")[];
                },
                parseResult: TorrentEngineParseResult;
            } | {
                error: string;
            };
        };

        appSetting: {
            variables: {
                scope: keyof SettingsSchema,
                name: string;
            },
            data: string | undefined;
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
            stage: "installed";
        };

        openRoute: {
            url: string;
        };
        updateConnectedModuleInfo: UpdateModuleInfo;

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
