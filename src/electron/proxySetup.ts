import axios from "axios";
import cheerio from "cheerio";
import dns from "dns";
import got, { Response } from "got";
import { typedIpcMain } from "typed-ipc";

import { settingsStore } from "../react/electron-shared/settings";
import { debug } from "./";
import { mainWindow } from "./mainWindow";

//for parser: "512 GB mb".replace(new RegExp(Object.keys(sizeMap).join("|"), "gi"), match => sizeMap[match.toUpperCase()])

// type LoopHandler<T, K> = (promiseResult: T) => ({ nextPromise: Promise<T>; } | { doneValue: K; });

// const loop = <T, K>(promise: Promise<T>, handler: LoopHandler<T, K>): Promise<K> =>
//     promise.then(handler).then(result => "nextPromise" in result ? loop(result.nextPromise, handler) : result.doneValue);


// todo add support for https://gimmeproxy.com/api/getProxy?protocol=http <-- in avarage there're faster
const proxySources = [
    {
        name: "Spys.me",//special thanks to site maintainer!
        url: "http://spys.me/proxy.txt",
        // todo use generator
        parseProxies(response: Response<string>): Iterable<string> {
            if (response.headers["content-type"] !== "text/plain") {
                throw new TypeError("Wrong content-type");
            }
            const regex = /\b(?<ip>(\d+\.){3}\d+:\d+) (?!RU)/gi;
            return {
                [Symbol.iterator]() {
                    // standard regex for proxy but with ignoring russian proxies
                    return {
                        next: () => {
                            const ipEntry = regex.exec(response.body);
                            if (ipEntry) {
                                return {
                                    done: false,
                                    value: ipEntry.groups!.ip
                                };
                            } else {
                                return { done: true, value: undefined };
                            }
                        }
                    };
                }
            };
        }
    }
];

const getProxiesIp = async (): Promise<string[] | Iterable<string> | undefined> => {
    for (let { url, parseProxies, name = url } of proxySources) {
        try {
            let response = await got(url, {
                responseType: "text"
            });
            return parseProxies(response);
        } catch (err) {
            debug(`Unable to get proxy list from ${name}: ${err.message}`);
            continue;
        }
    }
};

const isOnline = (): Promise<boolean> => new Promise(resolve => dns.lookup("google.com", (err: any) => resolve(!err || err.code !== "ENOTFOUND")));

interface HttpProxyEntry {
    host: string,
    port: string;
}

interface GetAliveProxyProps {
    proxies: string[] | Iterable<string>,
    testingSite: string,
    timeout: number,
    parallel: number,
    // onNextAttemp?: (attempNumber: number, proxyEntry: HttpProxyEntry) => any;
}
type GetAliveProxyResult = Promise<
    { errorMessage: string; } |
    { proxyIp: string; }
>;

//todo maxAttemps
const getAliveProxy = async ({ proxies, testingSite, timeout, parallel }: GetAliveProxyProps): GetAliveProxyResult => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const currentProxies: string[] = [];
        let i = 0;
        for (let proxy of proxies) {
            currentProxies.push(proxy);
            if (++i >= parallel) break;
        }
        debug(`Check proxy next attemp. Proxies: ${currentProxies.length}(${currentProxies.length === parallel ? "max" : "last"})`);
        const checkResults = await Promise.all(
            currentProxies.map(proxyIp =>
                checkTargetSiteWithProxy({
                    proxyIp,
                    testingSite,
                    timeout
                })
            )
        );
        const succeededProxy = checkResults.findIndex(result => result.success);
        if (succeededProxy >= 0) {
            return {
                proxyIp: currentProxies[succeededProxy]
            };
        } else {
            if (currentProxies.length < parallel) {
                // todo describe it in book
                const lastResult = checkResults.slice(-1)[0] as { errorMsg: string; };
                return {
                    errorMessage: `Proxies source ${proxySources[0].name}: ${lastResult.errorMsg}`
                };
            }
        }
    }
};

type CheckTargetSiteWithProxy = (
    props: {
        proxyIp: string;
    } & Pick<GetAliveProxyProps, "testingSite" | "timeout">
) => Promise<{
    success: false;
    errorMsg: string;
} | {
    success: true;
}>;

const checkTargetSiteWithProxy: CheckTargetSiteWithProxy = async ({ proxyIp, timeout: CHECK_TIMEOUT, testingSite }) => {
    debug(`Checking proxy: ${proxyIp}`);
    let [host, ...rest] = proxyIp.split(":");
    let port = +rest[0];
    if (isNaN(port)) throw TypeError("Port is not a number. Check the source.");
    let cancelSource = axios.CancelToken.source(),
        timeout = setTimeout(() => cancelSource.cancel("proxy_timeout"), CHECK_TIMEOUT);
    try {
        let { data } = await axios.get(testingSite, {
            proxy: {
                host,
                port
            },
            cancelToken: cancelSource.token
        });
        let $ = cheerio.load(data);
        const testingElementFound = !!$("div#index > table")[0];
        debug("Found working proxy ", proxyIp);
        if (!testingElementFound) {
            debug("Can't find table on working proxy!", proxyIp);
            throw new Error("Coundn't find testing element, skipping...");
        }
        return {
            success: true
        };
    } catch (err) {
        return {
            success: false,
            errorMsg: err.message
        };
    } finally {
        clearTimeout(timeout);
    }
};

const reportProxySetupStatus = (message: string) => {
    debug(`[proxy event]: ${message}`);
    typedIpcMain.sendToWindow(mainWindow, "showEvent", {
        type: "proxy",
        message
    });
};

export const setupProxy = async () => {
    const setupResult = await setupProxyInternal();
    if ("proxyIp" in setupResult) {
        const { proxyIp } = setupResult;
        debug(`Proxy setup success: ${proxyIp}`);
        settingsStore.set("internalActiveProxy", proxyIp);
        typedIpcMain.sendToWindow(mainWindow, "proxySetup", {
            success: true
        });
    } else {
        debug(`Proxy setup fatal`);
        typedIpcMain.sendToWindow(mainWindow, "proxySetup", {
            success: false,
            errorMessage: setupResult.errorMessage
        });
    }
};

const setupProxyInternal = async (): GetAliveProxyResult => {
    const testingSite = "http://rutor.info/top",
        checkTimeout = 7000;

    reportProxySetupStatus("Checking internet connection");
    if (await isOnline() === false) {
        //todo show user that internet is down
        reportProxySetupStatus("Internet is down");
        return {
            errorMessage: "Internet is down. Failed to get dns of google.com."
        };
    } else {
        reportProxySetupStatus("Internet is up!");
    }

    const prevActiveProxy = settingsStore.get("internalActiveProxy") as string;

    if (prevActiveProxy) {
        // todo-low more clear messages?
        reportProxySetupStatus("Checking proxy from previous session");
        const checkPrevProxyResult = await checkTargetSiteWithProxy({
            proxyIp: prevActiveProxy,
            testingSite,
            timeout: checkTimeout
        });
        if (checkPrevProxyResult.success) {
            return {
                proxyIp: prevActiveProxy
            };
        } else {
            reportProxySetupStatus("Previous proxy dead, obtaining new one");
        }
    }

    reportProxySetupStatus("Feting list or proxies to check");
    let proxies = await getProxiesIp();
    if (!proxies) {
        return { errorMessage: "unable to fetch any proxy list" };
    }
    let checkResult = await getAliveProxy({
        proxies,
        testingSite,
        // todo-moderate implement
        parallel: 6,
        timeout: checkTimeout,
    });
    if ("errorMessage" in checkResult) {
        return {
            // errorMessage: "Anomaly: Failed to check all proxies"
            errorMessage: checkResult.errorMessage
        };
    }
    let { proxyIp } = checkResult;
    reportProxySetupStatus(`Approved working proxy: ${JSON.stringify(proxyIp)}`);
    return { proxyIp };
};
