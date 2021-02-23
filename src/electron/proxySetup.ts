import axios from "axios";
import cheerio from "cheerio";
import dns from "dns";
import electronSettings from "electron-settings";
import got, { Response } from "got";
import { typedIpcMain } from "typed-ipc";
import util from "util";

import { debug } from "./";
import { mainWindow } from "./mainWindow";
import { getAppSetting } from "./settings";

//for parser: "512 GB mb".replace(new RegExp(Object.keys(sizeMap).join("|"), "gi"), match => sizeMap[match.toUpperCase()])

// type LoopHandler<T, K> = (promiseResult: T) => ({ nextPromise: Promise<T>; } | { doneValue: K; });

// const loop = <T, K>(promise: Promise<T>, handler: LoopHandler<T, K>): Promise<K> =>
//     promise.then(handler).then(result => "nextPromise" in result ? loop(result.nextPromise, handler) : result.doneValue);


const proxySources = [
    {
        name: "Spys.me",//special thanks to site maintainer!
        url: "http://spys.me/proxy.txt",
        additionalCheck(response: Response): boolean {
            let contentType = response.headers["content-type"];
            return contentType === "text/plain";
        }
    }
];

const getProxiesString = async (): Promise<string | undefined> => {
    for (let { url, additionalCheck, name } of proxySources) {
        try {
            let response = await got(url, {
                responseType: "text"
            });
            if (additionalCheck(response)) {
                return response.body;
            } else {
                throw new Error("Additional check failed");
            }
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
    proxies: string,
    testingSite: string,
    timeout: number,
    // parallel: number,
    // maxAttemps?: null | number,
    onNextAttemp?: (attempNumber: number, proxyEntry: HttpProxyEntry) => any;
}
type GetAliveProxyResult = Promise<
    { errorMessage: string; } |
    { proxy: HttpProxyEntry; }
>;

//todo maxAttemps
const getAliveProxy = async ({ proxies, testingSite, timeout, onNextAttemp }: GetAliveProxyProps): GetAliveProxyResult => {
    let getErrMsg = (msg: string) => `Proxies source spys.me: ${msg}`;

    //REGEXP FOR SEARCH ENTRIES IN PROXY LIST
    let spysMeIpRegexp = /\b(?<host>(\d+\.){3}\d+):(?<port>\d+) (?!RU)/gi;

    let attemps = 0,
        regexMatch: undefined | null | RegExpExecArray,
        lastErrorMsg = "no regex to match. check to source file";
    // eslint-disable-next-line no-cond-assign
    while (regexMatch = spysMeIpRegexp.exec(proxies)) {
        const { groups } = regexMatch;
        let { host, port } = groups!;
        onNextAttemp && onNextAttemp(++attemps, { host, port });
        const checkResult = await checkTargetSiteWithProxy({
            proxy: { host, port },
            testingSite,
            timeout
        });
        if (checkResult.success) {
            return {
                proxy: { host, port }
            };
        } else {
            lastErrorMsg = checkResult.errorMsg;
            continue;
        }
    }
    return {
        errorMessage: getErrMsg(lastErrorMsg)
    };
};

type CheckTargetSiteWithProxy = (
    props: {
        proxy: HttpProxyEntry;
    } & Pick<GetAliveProxyProps, "testingSite" | "timeout">
) => Promise<{
    success: false;
    errorMsg: string;
} | {
    success: true;
}>;

const checkTargetSiteWithProxy: CheckTargetSiteWithProxy = async ({ proxy, timeout: CHECK_TIMEOUT, testingSite }) => {
    const { host } = proxy,
        port = +proxy.port;
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
        debug("Found working proxy ", proxy);
        if (!testingElementFound) {
            debug("Can't find table on working proxy!!!", proxy);
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
    if ("proxy" in setupResult) {
        typedIpcMain.sendToWindow(mainWindow, "proxySetup", {
            success: true
        });
        const { proxy } = setupResult;
        await electronSettings.set(["torrentTrackers", "activeProxy"], [proxy.host, proxy.port].join(":"));
    } else {
        typedIpcMain.sendToWindow(mainWindow, "proxySetup", {
            success: false,
            errorMessage: setupResult.errorMessage
        });
    }
};

const setupProxyInternal = async (): GetAliveProxyResult => {
    const testingSite = "http://rutor.info/top",
        checkTimeout = 6000;

    reportProxySetupStatus("Checking internet connection");
    if (await isOnline() === false) {
        //todo show user that internet is down
        reportProxySetupStatus("Internet is down");
        return {
            errorMessage: "Internet is down. Failed to checked dns of google.com."
        };
    } else {
        reportProxySetupStatus("Internet is up!");
    }

    const prevActiveProxy = await getAppSetting("torrentTrackers", "activeProxy");

    if (prevActiveProxy) {
        // todo-low more clear messages?
        reportProxySetupStatus("Checking proxy from previous session");
        const [host, port] = prevActiveProxy.split(":");

        const checkPrevProxyResult = await checkTargetSiteWithProxy({
            proxy: { host, port },
            testingSite,
            timeout: checkTimeout
        });
        if (checkPrevProxyResult.success) {
            return {
                proxy: { host, port }
            };
        } else {
            reportProxySetupStatus("Previous proxy dead, obtaining new one");
        }
    }

    reportProxySetupStatus("Feting list or proxies to check");
    let proxies = await getProxiesString();
    if (!proxies) {
        return { errorMessage: "unable to fetch any proxy list" };
    }
    let checkResult = await getAliveProxy({
        proxies,
        testingSite,
        // todo-moderate implement
        // parallel: 10,
        timeout: checkTimeout,
        onNextAttemp(attempNumber, proxyEntry) {
            debug(`Attemp number ${attempNumber}. Cheking proxy: ${util.format(proxyEntry)}`);
        }
    });
    if ("errorMessage" in checkResult) {
        return {
            // errorMessage: "Anomaly: Failed to check all proxies"
            errorMessage: checkResult.errorMessage
        };
    }
    let { proxy } = checkResult;

    reportProxySetupStatus(`Approved working proxy: ${JSON.stringify(proxy)}`);

    return { proxy };
};
