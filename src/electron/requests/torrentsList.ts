import { IpcMainHandler } from "typed-ipc";

import { requestSiteWithProxies } from "@zardoy/proxy-util/filmomania/request";

import { proxyReady, setupProxy } from "../proxy";
import rutorConfig from "../torrentTrackers/rutor/config";
import { settingsStore } from "../../react/electron-shared/settings";

export const requestTorrentsList: IpcMainHandler<"torrentsList"> = async (_event, { searchQuery }) => {
    const torrentEngineConfig = rutorConfig;

    const proxies = settingsStore.settings.internal.activeProxies
    if (/* !proxyReady ||  */!proxies) throw new Error(`Proxy is not ready yet`);

    const requestUrl = torrentEngineConfig.getRequestUrl(searchQuery);
    const fetchData = async (retry: number) => {
        try {
            return await requestSiteWithProxies(proxies.split(","), encodeURI(requestUrl))
        } catch (err: any) {
            // todo compare code
            if (retry < 1 && (err.message.includes("ETIMEDOUT") || err.message.includes("ECONNREFUSED"))) {
                await setupProxy()
                return await fetchData(retry + 1)
            }
            throw err
        }
    }
    const axiosResponse = await fetchData(0);
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
