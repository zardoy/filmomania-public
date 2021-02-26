import { IpcMainHandler } from "typed-ipc";

import { getAppSetting } from "../settings";
import rutorConfig from "../torrentTrackers/rutor/config";

//@ts-ignore
export const requestTorrentsList: IpcMainHandler<"torrentsList"> = async (_event, { searchQuery }) => {
    const torrentEngineConfig = rutorConfig;

    const proxyIp = await getAppSetting("torrentTrackers", "activeProxy");

    if (!proxyIp) {
        throw new Error("Proxy isn't ready");
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
