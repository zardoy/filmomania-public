import axios from "axios";

import { TorrentEngineParseResult } from "../../../react/electron-shared/torrentTypes";
import htmlParser from "./parser";

export default {
    name: "rutor.info",
    async getResults(searchQuery: string, proxyIp: string): Promise<TorrentEngineParseResult> {
        const categories = {
            foreign: 1,
            native: 5
        };
        // const filmNameToSearch = film.nameRu.includes("/") - особый случай
        //TODO: исключать пробельные символы - investigate
        const getURL = (category_number: number) => `http://rutor.info/search/0/${category_number}/100/2/${searchQuery}`;//nameru and nameen TODO: escaping spec symbols
        const url = getURL(0);
        console.log("Tracker request URL", url);
        // return [getURL(categories.foreign), ...film.country.filter(({ country }) => country === "Россия").length ? [getURL(categories.native)] : []];


        const [host, port] = proxyIp.split(":");
        const { data } = await axios.get(encodeURI(url), {
            proxy: {
                host: host!,
                port: +port!
            }
        });

        return htmlParser(data, true);
    }
};
