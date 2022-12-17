import { IpcMainHandler } from "typed-ipc";

import { requestSiteWithProxies } from "@zardoy/proxy-util/filmomania/request";

import { proxyReady } from "../proxy";
import rutorConfig from "../torrentTrackers/rutor/config";
import { settingsStore } from "../../react/electron-shared/settings";

export const requestTorrentsList: IpcMainHandler<"torrentsList"> = async (_event, { searchQuery }) => {
    const torrentEngineConfig = rutorConfig;

    const proxies = settingsStore.settings.internal.activeProxies
    if (/* !proxyReady ||  */!proxies) throw new Error(`Proxy is not ready yet`);

    const requestUrl = torrentEngineConfig.getRequestUrl(searchQuery);
    const axiosResponse = await requestSiteWithProxies(proxies.split(","), encodeURI(requestUrl));
    const engineResult = await torrentEngineConfig.parseData(axiosResponse);

    return {
        metdata: {
            engines: [torrentEngineConfig.name],
            // warnings: engineResult.hiddenResults > 0 ? [""] : ""
            warnings: []
        },
        parseResult: engineResult
    };
};
