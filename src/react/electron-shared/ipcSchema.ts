import { ExternalModulesInfo, ExternalPlayer } from "./ExternalModule";
import { TorrentItem } from "./TorrentItem";

export type UpdateModuleInfo<K extends keyof ExternalModulesInfo = keyof ExternalModulesInfo> = {
    module: K;
    newInfo: ExternalModulesInfo[K];
};

declare module "typed-ipc" {
    interface IpcMainEvents {
        appInit: null;
    }

    interface IpcMainQueries {
        appInit: {
            data: {
                isFirstLaunch: boolean;
            };
        };

        torrentsList: {
            variables: {
                searchQuery: string;
            };

            data: {
                metdata: {
                    engines: string[];
                    warnings: ("TOO_MANY_RESULTS")[];
                },
                torrents: TorrentItem[];
            } | {
                error: string;
            };
        };
    }

    interface IpcRendererEvents {
        openUrl: {
            url: string;
        };
        updateConnectedModuleInfo: UpdateModuleInfo;

        firstRunSpecs: {
            /**
             * null if not installed
             */
            installedAceStreamVersion: string | null;
            installedPlayers: ExternalPlayer[];
        };
    }
}
