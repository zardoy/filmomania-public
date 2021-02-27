import cheerio from "cheerio";
import xbytes from "xbytes";

import { TorrentEngineParseResult, TorrentItem } from "../../../react/electron-shared/TorrentTypes";

const mapUnits = {
    MB: "МБ",
    GB: "ГБ"
};

// error format. Parse [full_url] error: message
export default (searchResultsHtml: string, onlyMovies: boolean): TorrentEngineParseResult => {
    const $ = cheerio.load(searchResultsHtml);
    const indexEl = $("#index");
    if (!indexEl.length) {
        throw new TypeError(
            `No #index table with results in html`
        );
    }
    const actualResultsCount =
        //@ts-ignore
        +$("#index").contents().filter((_index, elem) => elem.nodeType === 3)[0]?.data.match(/\d+/)?.[0];
    let table = indexEl.find("table");
    let trElems = table.find("tr:not(.backgr)");
    let torrentItems: TorrentItem[] = trElems.map((_index, rawElem): TorrentItem | null => {
        const elem = $(rawElem);

        const titleRow = elem.find(":nth-child(2)"),
            title = titleRow.text();

        // filter only movies
        if (title && onlyMovies) {
            // todo very high exclude that are present in name
            const badRegexps = [
                /\bmp3\b/i,
                /\bost\b/i,
                /\bflac\b/i,
                /\bsoundtrack\b/i,
                /\bjpg\b/i,
                /\bpng\b/i,
            ];
            for (const badRegexp of badRegexps) {
                if (badRegexp.test(title)) return null;
            }
        }

        const torrentURL = titleRow.find("a.downgif").attr("href"),
            torrentID = torrentURL?.match(/\d+/)?.[0];


        let pageURL = titleRow.find(`a[href*="/torrent/"]`).attr("href")?.trim();
        if (pageURL) pageURL = `http://rutor.info${pageURL}`;

        const rawSize = elem.find(":nth-last-child(2)").text().trim();
        const xbytesInfo = xbytes.parseBytes(rawSize);
        const sizeInBytes = xbytesInfo.bytes;
        //@ts-ignore
        const displaySize = `${parseFloat(rawSize).toFixed(1)} ${mapUnits[xbytesInfo["unit"]] ?? xbytesInfo["unit"]}`;

        const result = {
            title,
            // magnet: dirtyMagnetHref.slice(dirtyMagnetHref.lastIndexOf("magnet:")),
            magnet: titleRow.find(`a[href*="magnet:"]`).attr("href"),
            torrentURL,
            torrentID: torrentID && +torrentID,
            pageURL,
            displaySize,
            sizeInBytes,
            seeders: +elem.find(".green").text(),
            quality: "unknown",
            hdr: false
        } as TorrentItem;
        for (const [key, val] of Object.entries(result)) {
            // if value is empty or undefined - something went wrong
            if (val === "" || val === undefined) {
                // throw
                return null;
            }
            // normalize all string fields
            if (typeof val !== "string") continue;
            //@ts-ignore
            result[key] = val.trim();
        }
        return result;
    }).get().filter(a => a);
    if (trElems.length && !torrentItems.length) {
        // todo-low translate why not
        throw new Error("Ошибка парсинга всех результатов из таблицы table.");
    }
    let hiddenResults = actualResultsCount > torrentItems.length ? actualResultsCount - torrentItems.length : 0;
    return {
        hiddenResults,
        totalResults: actualResultsCount,
        results: torrentItems
    };
};
