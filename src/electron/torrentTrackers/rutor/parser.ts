//@ts-nocheck

import { parseTrackerResult, trackerResult } from "../../../electron-shared/films";

// interface trackerItemRawData {
//     title: string,
//     size: string,
//     magnet: string,
//     torrentFileUrl: string,
//     pageUrl: string,
//     seeders: number
// }

const normolizeAllLinks = (elem: HTMLElement) => {
    [].forEach.call(
        elem.querySelectorAll(`a[href^="http://azuae.com/proxy1/index.php?q=`),
        (a: HTMLAnchorElement) => {
            a.href = decodeURIComponent(a.href.slice(36));
        }
    );
};

export default (fetchedHtml: string): parseTrackerResult => {
    let html = document.createElement("html");
    html.innerHTML = fetchedHtml;
    let indexElem = html.querySelector("#index");
    if (!indexElem) {
        return {
            error: "Ошибка парсинга. Отсутствует #index из ответа rutor.info."
        };
    }
    let resultsTextNode = indexElem.childNodes[1];
    let actualResultsCount = (resultsTextNode && resultsTextNode.textContent) ? parseInt(resultsTextNode.textContent.slice(20)) : NaN;
    let table = indexElem.querySelector("table");
    if (!table) {
        return {
            error: "Ошибка парсинга. Отсутствует таблица table с результатами."
        };
    }
    let trElems = table.querySelectorAll("tr:not(.backgr)");
    let trackerRawList = [].map.call(trElems, (trElem: HTMLTableRowElement, index: number): trackerResult | null => {
        normolizeAllLinks(trElem);
        let titleRow = trElem.children[1];
        if (!titleRow || !titleRow.textContent) return null;
        let aMagnet = titleRow.querySelector(`a[href*="magnet:"]`);
        let aFile = titleRow.querySelector(`a.downgif`);
        let aPage = titleRow.querySelector(`a[href^="http://rutor.info/torrent/"]`);
        if (!aMagnet || !aFile || !aPage) return null;
        let pageURL = (aPage as HTMLAnchorElement).href;
        let torrentID = pageURL.slice("http://rutor.info/torrent/".length);
        torrentID = torrentID.slice(0, torrentID.indexOf("/"));
        let dirtyMagnetHref = (aMagnet as HTMLAnchorElement).href;
        let sizeElem = [].slice.call(trElem.children, -2)[0] as HTMLTableCellElement;
        let seedersElem = trElem.querySelector("span.green");
        if (!sizeElem || !sizeElem.textContent || !seedersElem || !seedersElem.textContent) return null;
        return {
            title: titleRow.textContent.slice(1),
            magnet: dirtyMagnetHref.slice(dirtyMagnetHref.lastIndexOf("magnet:")),
            torrentURL: (aFile as HTMLAnchorElement).href,
            torrentID: +torrentID,
            pageURL,
            size: Math.floor(parseFloat(sizeElem.textContent) * 10) / 10 + " " + sizeElem.textContent.slice(-2).replace(/GB/g, "ГБ").replace(/MB/g, "МБ"),
            seeders: +seedersElem.textContent.slice(1)
        };
    }).filter(a => a) as trackerResult[];
    if (trElems.length && !trackerRawList.length) {
        return {
            error: "Ошибка парсинга всех результатов из таблицы table."
        };
    }
    let resultsDiff = actualResultsCount > trackerRawList.length ? actualResultsCount - trackerRawList.length : 0;
    return {
        resultsDiff,
        trackerResults: trackerRawList
    };
};
