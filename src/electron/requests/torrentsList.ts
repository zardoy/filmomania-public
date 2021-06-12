import { IpcMainHandler } from "typed-ipc";

import { settingsStore } from "../settings";
import rutorConfig from "../torrentTrackers/rutor/config";

//@ts-ignore
export const requestTorrentsList: IpcMainHandler<"torrentsList"> = async (_event, { searchQuery }) => {
    const torrentEngineConfig = rutorConfig;

    const proxyIp = await settingsStore.get("internal", "activeProxy");

    if (!proxyIp) {
        throw new Error("Proxy is not set");
    }

    try {
        const engineResult = await torrentEngineConfig.getResults(searchQuery, proxyIp);
        return {
            metdata: {
                engines: torrentEngineConfig.name,
                // warnings: engineResult.hiddenResults > 0 ? [""] : ""
                warnings: []
            },
            parseResult: engineResult
        };
    } catch (err) {
        return {
            error: err.message
        };
    }
};
