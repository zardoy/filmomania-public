import { makeVar } from "@apollo/client";

import { ExternalModulesInfo } from "./electron-shared/ExternalModule";
import { ParsedFilmInfo } from "./utils/search-engine";

interface GlobalFilmInfoCache {
    [filmId: string]: ParsedFilmInfo;
}

export const currentSearchFilmsVar = makeVar([] as ParsedFilmInfo[]);

export const externalModulesStatusVar = makeVar({
    aceStream: {
        connected: false
    },
    externalPlayer: {
        connected: false
    }
} as ExternalModulesInfo);
