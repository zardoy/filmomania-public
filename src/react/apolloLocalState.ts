import { makeVar } from "@apollo/client";

import { ExternalModulesInfo } from "./electron-shared/ExternalModule";
import { ParsedFilmInfo } from "./utils/search-engine";

interface GlobalFilmInfoCache {
    [filmId: string]: ParsedFilmInfo;
}

export const currentSearchFilmsVar = makeVar<ParsedFilmInfo[]>([]);
export const appFirstLaunchVar = makeVar(false);

export const externalModulesStatusVar = makeVar<ExternalModulesInfo>({
    aceStream: {
        status: "disconnected"
    },
    defaultExternalPlayer: {
        connected: false
    },
    foundExternalPlayers: []
});
