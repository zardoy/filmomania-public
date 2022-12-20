import { TrackerConfigType } from "../configType";
import parseHtml from "./parser";

export default {
    name: "rutor.info",
    getRequestUrl: searchQuery => {
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
        return url;
    },
    async parseData({ data }) {
        return parseHtml(data, true);
    }
} satisfies TrackerConfigType;
