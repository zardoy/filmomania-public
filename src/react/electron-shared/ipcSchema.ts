import { ExternalModulesInfo, ExternalPlayer } from "./ExternalModule";
import { TorrentItem } from "./TorrentItem";

export type UpdateModuleInfo = Partial<ExternalModulesInfo>;

declare module "typed-ipc" {
    interface IpcMainEvents {
        setupFirstLaunch: {
            defaultPlayerIndex: number;
        };
    }

    interface IpcMainRequests {
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
        openRoute: {
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
