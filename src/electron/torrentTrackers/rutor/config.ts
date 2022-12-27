import { settingsStore } from "../../../react/electron-shared/settings";
import { TrackerConfigType } from "../configType";
import parseHtml from "./parser";

export default {
    name: "rutor.info",
    getRequestUrl: searchQuery => {
        const categories = {
            foreign: 1,
            native: 5
        };
        const excludeChars = ["?", "/", "(", ")", "\\"]
        for (const excludeChar of excludeChars) {
            searchQuery = searchQuery.replaceAll(excludeChar, " ")
        }
        const getURL = (category_number: number) => settingsStore.settings.providers.rutorInfoRequestUrl.replaceAll("${category_number_fake}", "0").replaceAll("${category_number}", category_number.toString()).replaceAll("${searchQuery}", searchQuery)
        const url = getURL(0);
        console.log("Tracker request URL", url);
        // return [getURL(categories.foreign), ...film.country.filter(({ country }) => country === "Россия").length ? [getURL(categories.native)] : []];
        return url;
    },
    async parseData({ data }) {
        return parseHtml(data, true);
    }
} satisfies TrackerConfigType;
