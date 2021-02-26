import _ from "lodash";
import { Merge, RequireExactlyOne } from "type-fest";
import { typedIpcRenderer } from "typed-ipc";
import { pluck } from "underscore";

export type FilmsOrError = RequireExactlyOne<{
    error?: string;
    films?: ParsedFilmInfo[];
}, "error" | "films">;

export interface FilmsSearchEngineResponse {
    keyword: string,
    /**
     * Total number of pages
     */
    pagesCount: number,
    films: ParsedFilmInfo[],
    searchFilmsCountResult: number;
}

// Show indicators: nameRu or nameEn could include (мини-сериал) or (сериал) at the end or if year is num-num or num-...
interface RawFilmInfo {
    filmId: number,
    /**
     * Could be ""
     */
    nameRu: string,
    /**
     * Could be "" "Player$"
     */
    nameEn: string,
    type: "FILM" | "TV_SHOW" | "UNKNOWN";
    // Could be "2002-..." <- до сегодняшная дня
    year?: string,
    description?: string,
    /**
     * if it's "" - not released yet
     * @example 2:20
     */
    filmLength?: string,
    countries: Array<{
        /**
         * @example "США" "Китай" "Япония" "Россия" "Норвегия"
         */
        country: string;
    }>,
    genres: Array<{
        genre: string;
    }>,
    /**
     * float 0 - 10 or 99% if not released yet
     */
    rating?: string,
    ratingVoteCount: number,
    posterUrl?: string;
    posterUrlPreview?: string;
}

export type ParsedFilmInfo = Merge<Omit<RawFilmInfo, "year">, {
    /**
     * Number of minutes
     */
    filmLength: number,
    countries: string[],
    genres: string[];
    rating: number;
    released: boolean;
    cleanName: string;
} & ({
    type: "film";
    year: number;
} | {
    type: "show";
    yearFrom: number;
    yearTo: number | "nowadays";
})>;
// } & ({
//     type: "film",
//     year: number;
// } | {
//     type: "series",
//     year: number;
// })

interface RequestOptions {
    abortSignal: AbortSignal;
}

export const SEARCH_QUERY_MIN_LENGTH = 3;

const numberOrUndefined = (value: string | number | undefined, intOrFloat: "float" | "int" = "float") => {
    const correctlyTypedValue = value as string;
    const parsedValue = intOrFloat === "float" ? parseFloat(correctlyTypedValue) : parseInt(correctlyTypedValue);
    // ban Infinity
    return !isNaN(parsedValue) && isFinite(parsedValue) ? parsedValue : undefined;
};

/**
 * Mutates object.
 */
const ensureIsNumber = <K extends object>(obj: K, props: (keyof K)[], ifNaN: "throw" | "setUndefined" = "setUndefined") => {
    Object.entries(_.pick(obj, props)).forEach(([propName, value]) => {
        if (typeof value === "number") return;
        const parsedValue = numberOrUndefined(value as string);
        if (parsedValue === undefined && ifNaN === "throw") {
            throw new TypeError(`Property ${propName} is not a number!`);
        }
        //@ts-ignore
        obj[propName] = parsedValue;
    });
};

// make expirable?
export const searchFilmsCache = new Map<string, FilmsSearchEngineResponse>();

export const searchByQuery = async (query: string, { abortSignal }: RequestOptions): Promise<FilmsSearchEngineResponse> => {
    query = query.trim();
    if (searchFilmsCache.has(query)) {
        return searchFilmsCache.get(query)!;
    }
    let provider = await typedIpcRenderer.request("appSetting", {
        scope: "searchEngine",
        name: "apiEndpoint"
    });
    if (!provider!.startsWith("http")) provider = `https://${provider}`;
    const requestURL = new URL(provider!);
    requestURL.searchParams.append("keyword", query);
    // todo-low make request from node in order to increase performace by several ms
    const response = await fetch(requestURL.toString(), {
        signal: abortSignal,
        headers: {
            "X-API-KEY": (await typedIpcRenderer.request("appSetting", {
                scope: "searchEngine",
                name: "apiKey"
            }))!
        }
    });
    type SearchResultType = Merge<FilmsSearchEngineResponse, { films: RawFilmInfo[]; }>;
    const searchResult: SearchResultType = await response.json();

    const currentYear = new Date().getFullYear();
    // todo REWRITE TYPES AND OBJ MERGING
    // NORMALIZING DATA
    const parsedFilms = searchResult.films
        .filter(({ nameEn, nameRu, filmId }) => {
            if (!nameEn && !nameRu) {
                // eslint-disable-next-line no-console
                console.error(`Skipping film with id ${filmId} as it missing both names (en and ru)`);
                return false;
            }
            const badNamesRegex = /\(видео\)$/;
            if (
                nameEn && nameEn.match(badNamesRegex) ||
                nameRu && nameRu.match(badNamesRegex)
            ) {
                return false;
            } else {
                return true;
            }
        })
        .map((film): ParsedFilmInfo => {
            try {
                if (typeof film.filmId !== "number") throw new TypeError(`filmID ${film.filmId} is not a number`);
                ensureIsNumber(film, ["ratingVoteCount"]);

                // todo TS fluent filling
                const newProps: Partial<ParsedFilmInfo> = {
                    countries: pluck(film.countries, "country"),
                    genres: pluck(film.genres, "genre")
                };
                if (film.filmLength) {
                    const execResult = /(\d{1,2})\s?:\s?(\d{1,2})/.exec(film.filmLength.trim());
                    if (execResult) {
                        const [, hours, minutes] = execResult;
                        newProps.filmLength = numberOrUndefined(+hours * +minutes);
                    }
                }
                // ignore other indicators for now
                newProps.type = film.year?.includes("-") ? "show" : "film";
                if (newProps.type === "film") {
                    // print warning
                    ensureIsNumber(film, ["year"]);
                    newProps.year = film.year as unknown as number;
                } else if (newProps.type === "show") {
                    const [, yearFrom, yearTo] = /(.+)-(.+)/.exec(film.year!.trim())!;
                    newProps.yearFrom = +yearFrom;
                    newProps.yearTo = yearTo === "..." ? "nowadays" : +yearTo;
                    ensureIsNumber(newProps, ["yearFrom"]);
                }

                newProps.rating = film.rating && !film.rating.endsWith("%") ? numberOrUndefined(film.rating) : undefined;
                newProps.released =
                    newProps.type === "show" ? newProps.yearFrom! < currentYear :
                        newProps.type === "film" ? newProps.year! < currentYear : false;
                // in case if it was released this year, it must have rating
                if (!newProps.released && newProps.rating !== undefined) {
                    newProps.released = true;
                }
                if (film.description) {
                    // todo-high
                    film.description = film.description.replace(/.(?=\(.*\)$)/, "$& ");
                }

                newProps.cleanName = (film.nameRu || film.nameEn).replace(/\(.*\)$/g, "").trim();

                return {
                    ...film,
                    ...newProps as ParsedFilmInfo
                };
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Skipped film from search results", err);
                return undefined!;
            }
        })
        .filter(film => film !== undefined && film.released);

    const result = {
        ...searchResult,
        films: parsedFilms
    };
    searchFilmsCache.set(query, result);

    return result;
};
