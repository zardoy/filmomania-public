import _ from "lodash";
import { Except, Merge, RequireExactlyOne } from "type-fest";
import { pluck } from "underscore";

import { settingsStore } from "../electron-shared/settings";

export type FilmsOrError = RequireExactlyOne<{
    error?: string
    films?: ParsedFilmInfo[]
}, "error" | "films">

export interface FilmsSearchEngineResponse {
    keyword: string,
    /**
     * Total number of pages
     */
    pagesCount: number,
    films: ParsedFilmInfo[],
    searchFilmsCountResult: number
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
    type: "FILM" | "TV_SHOW" | "UNKNOWN"
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
        country: string
    }>,
    genres: Array<{
        genre: string
    }>,
    /**
     * float 0 - 10 or 99% if not released yet
     */
    rating?: string,
    ratingVoteCount: number,
    posterUrl?: string
    posterUrlPreview?: string
}

interface RawFilmInfoNewEndpoint {
    kinopoiskId: number,
    /**
     * Could be ""
     */
    nameRu: string,
    /**
     * Could be "" "Player$"
     */
    nameOriginal: string,
    type: "FILM" | "TV_SHOW" | "TV_SERIES" | "MINI_SERIES" | "UNKNOWN"
    // Could be "2002-..." <- до сегодняшная дня
    year?: number,
    // description?: string,
    /**
     * if it's "" - not released yet
     * @example 2:20
     */
    // filmLength?: string,
    countries: Array<{
        /**
         * @example "США" "Китай" "Япония" "Россия" "Норвегия"
         */
        country: string
    }>,
    genres: Array<{
        genre: string
    }>,
    ratingKinopoisk?: number,
    /**
     * float 0 - 10 or 99% if not released yet
     */
     rating?: string,
     ratingVoteCount: number,
     posterUrl?: string
     posterUrlPreview?: string
}

export type ParsedFilmInfo = Merge<Omit<RawFilmInfo, "year">, {
    /**
     * Number of minutes
     */
    filmLength: number,
    countries: string[],
    genres: string[]
    rating: number
    released: boolean
    cleanName: string
} & ({
    type: "film"
    year: number
} | {
    type: "show"
    yearFrom: number
    yearTo: number | "nowadays"
})>
// } & ({
//     type: "film",
//     year: number;
// } | {
//     type: "series",
//     year: number;
// })

interface RequestOptions {
    abortSignal: AbortSignal
}

export const SEARCH_QUERY_MIN_LENGTH = 3

// todo lib
const numberOrUndefined = (value: string | number | undefined, intOrFloat: "float" | "int" = "float") => {
    const correctlyTypedValue = value as string
    const parsedValue = intOrFloat === "float" ? parseFloat(correctlyTypedValue) : parseInt(correctlyTypedValue)
    // ban Infinity
    return !isNaN(parsedValue) && isFinite(parsedValue) ? parsedValue : undefined
}

/**
 * Mutates object.
 */
const ensureIsNumber = <K extends object>(obj: K, props: (keyof K)[], ifNaN: "throw" | "setUndefined" = "setUndefined") => {
    Object.entries(_.pick(obj, props)).forEach(([propName, value]) => {
        if (typeof value === "number") return
        const parsedValue = numberOrUndefined(value as unknown as string)
        if (parsedValue === undefined && ifNaN === "throw") {
            throw new TypeError(`Property ${propName} is not a number!`)
        }
        //@ts-ignore
        obj[propName] = parsedValue
    })
}

const expiration = 12 * 60 * 60 * 1000 //12 hours

const cache = new Map<string, { timeStamp: number, value: FilmsSearchEngineResponse }>()

const getCachedQuery = (keyword: string) => {
    const cached = cache.get(keyword)
    if (!cached) return undefined
    if (Date.now() - cached.timeStamp > expiration) return undefined
    return cached.value
}

const setCachedQuery = (keyword: string, value: FilmsSearchEngineResponse) => {
    cache.set(keyword, {
        timeStamp: Date.now(),
        value
    })
}

const getCleanName = (film: Pick<RawFilmInfo, "nameRu" | "nameEn">) => {
    return (film.nameRu || film.nameEn).replace(/\(.*\)$/g, "").trim()
}

export const searchByQuery = async (query: string, { abortSignal }: RequestOptions): Promise<FilmsSearchEngineResponse> => {
    query = query.trim()
    const cachedValue = getCachedQuery(query)
    if (cachedValue) return cachedValue

    let { endpoint, apiKey } = settingsStore.settings.movieSearchEngine
    if (!endpoint) throw new TypeError(`Endpoint is not set`)
    if (!endpoint.startsWith("http")) endpoint = `https://${endpoint}`
    const requestURL = new URL(endpoint)
    requestURL.searchParams.append("keyword", query)
    // todo-low make request from node in order to increase performace by several ms
    const response = await fetch(requestURL.toString(), {
        signal: abortSignal,
        headers: {
            "X-API-KEY": apiKey!
        }
    })
    const searchResult: { films: RawFilmInfo[] } & Except<FilmsSearchEngineResponse, "films"> = await response.json()

    const currentYear = new Date().getFullYear()
    // todo REWRITE TYPES AND OBJ MERGING
    // NORMALIZING DATA
    const parsedFilms = searchResult.films
        .filter(({ nameEn, nameRu, filmId }) => {
            if (!nameEn && !nameRu) {
                // eslint-disable-next-line no-console
                console.error(`Skipping film with id ${filmId} as it missing both names (en and ru)`)
                return false
            }
            const badTitlesRegex = /\(видео|короткометражка\)$/
            if (
                nameEn && nameEn.match(badTitlesRegex) ||
                nameRu && nameRu.match(badTitlesRegex)
            ) {
                return false
            } else {
                return true
            }
        })
        .map((film: RawFilmInfo): ParsedFilmInfo => {
            try {
                if (typeof film.filmId !== "number") throw new TypeError(`filmID ${film.filmId} is not a number`)
                ensureIsNumber(film, ["ratingVoteCount"])

                // todo TS fluent filling
                const newProps: Partial<ParsedFilmInfo> = {
                    countries: pluck(film.countries, "country"),
                    genres: pluck(film.genres, "genre")
                }
                if (film.filmLength) {
                    const execResult = /(\d{1,2})\s?:\s?(\d{1,2})/.exec(film.filmLength.trim())
                    if (execResult) {
                        const [, hours, minutes] = execResult
                        newProps.filmLength = numberOrUndefined(+hours! * +minutes!)
                    }
                }
                // ignore other indicators for now
                newProps.type = film.year?.includes("-") ? "show" : "film"
                if (newProps.type === "film") {
                    // print warning
                    ensureIsNumber(film, ["year"])
                    newProps.year = film.year as unknown as number
                } else if (newProps.type === "show") {
                    const [, yearFrom, yearTo] = /(.+)-(.+)/.exec(film.year!.trim())!
                    newProps.yearFrom = +yearFrom!
                    newProps.yearTo = yearTo === "..." ? "nowadays" : +yearTo!
                    ensureIsNumber(newProps, ["yearFrom"])
                }

                newProps.rating = film.rating && !film.rating.endsWith("%") ? numberOrUndefined(film.rating) : undefined
                newProps.released =
                    newProps.type === "show" ? newProps.yearFrom! < currentYear :
                        newProps.type === "film" ? newProps.year! < currentYear : false
                // in case if it was released this year, it must have rating
                if (!newProps.released && newProps.rating !== undefined) {
                    newProps.released = true
                }
                if (film.description) {
                    // todo-high
                    film.description = film.description.replace(/.(?=\(.*\)$)/, "$& ")
                }

                newProps.cleanName = getCleanName(film)

                return {
                    ...film,
                    ...newProps as ParsedFilmInfo
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Skipped film from search results", err)
                return undefined!
            }
        })
        .filter(film => film !== undefined && film.released)

    const result: FilmsSearchEngineResponse = {
        ...searchResult,
        films: parsedFilms
    }
    setCachedQuery(query, result)

    return result
}

interface FilmEntryInterestedDataResponse {
    imdbId: string,
    nameRu: string,
    nameOriginal: string,
    coverUrl: string | null,
    logoUrl: string | null,
    isTicketsAvailable: boolean,
    serial: boolean,
    slogan?: string,
}

export const getFilmData = async (entryId: number, abortSignal: AbortSignal) => {
    const cached = sessionStorage.getItem(`film:${entryId}`)
    if (cached) return JSON.parse(cached) as never
    let { entryIdEndpoint = import.meta.env.VITE_SEARCH_ENGINE_ENTRY_ENDPOINT, apiKey } = settingsStore.settings.movieSearchEngine
    if (!entryIdEndpoint) throw new TypeError(`EntryIdEndpoint is not set`)
    if (!entryIdEndpoint.startsWith("http")) entryIdEndpoint = `https://${entryIdEndpoint}`
    const requestURL = new URL(`${entryIdEndpoint.replace(/\/$/, "")}/${entryId}`)
    const response = await fetch(requestURL.toString(), {
        signal: abortSignal,
        headers: {
            "X-API-KEY": apiKey!
        }
    })
    const data: FilmEntryInterestedDataResponse = await response.json()
    if ("error" in data) throw new Error(`Server Returned Error: ${data.error}`)
    const resolvedData = {...data, year: ("yearFrom" in data ? data.yearFrom : data["year"]) as string, cleanName: getCleanName({nameRu: data.nameRu, nameEn: data.nameOriginal})}
    sessionStorage.setItem(`film:${entryId}`, JSON.stringify(resolvedData))
    return resolvedData
}
