import { getAliveProxies } from "@zardoy/proxy-util/filmomania";
import { settingsStore } from "../react/electron-shared/settings";

export let proxyReady = false;

export const setupProxy = () => {
    void (async () => {
        proxyReady = false;
        const prevProxies = settingsStore.settings.internal.activeProxies || "";
        // show loading toast. show attemps (group numbers)
        const aliveProxies = await getAliveProxies(prevProxies.split(","), {});
        settingsStore.set("internal", "activeProxies", aliveProxies.join(","));
        proxyReady = true;
    })();
};
