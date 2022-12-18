import { getAliveProxies } from "@zardoy/proxy-util/filmomania";
import { settingsStore } from "../react/electron-shared/settings";

export let proxyReady = false;

export const setupProxy = async () => {
    proxyReady = false;
    const prevProxies = settingsStore.settings.internal.activeProxies || "";
    // show loading toast. show attemps (group numbers)
    console.log("getAliveProxies")
    console.time("getAliveProxies")
    const aliveProxies = await getAliveProxies(prevProxies.split(","), {});
    console.timeEnd("getAliveProxies")
    settingsStore.set("internal", "activeProxies", aliveProxies.map(({ip}) => ip).join(","));
    proxyReady = true;
};
