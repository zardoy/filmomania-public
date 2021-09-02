import { AxiosResponse } from "axios";

import { TorrentEngineParseResult } from "../../react/electron-shared/torrentTypes";

export type TrackerConfigType = {
    name: string;
    getRequestUrl: (searchQuery: string) => string;
    parseData: (axiosResponse: AxiosResponse) => Promise<TorrentEngineParseResult>;
};
