import { LiteralUnion } from "type-fest";

export interface TorrentItem {
    // basic info
    /**
     * Torrent ID on tracker
     */
    torrentID: number;
    /**
     * Torrent URL of tracker
     */
    pageURL: string;
    /**
     * Full title "раздачи"
     */
    title: string;

    // torrent info
    /**
     * `.torrent` file url
     */
    torrentURL: string;
    /**
     * Torrent magnet
     */
    magnet: string;
    /**
     * # of seeders. Main sort param
     */
    seeders: number;

    // file info
    /**
     * File size in bytes
     */
    // size: number;
    /**
     * Human readable size of file
     */
    sizeDisplay: number;

    // video info
    /**
     * Parsed from resolution
     */
    quality: LiteralUnion<"480p" | "720p" | "1080p" | "4K" | "???", string>;
    /**
     * Whether is in hdr
     */
    hdr: boolean;
}
