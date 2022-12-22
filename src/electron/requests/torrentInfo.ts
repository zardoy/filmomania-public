import { IpcMainHandler } from "typed-ipc";
import { getHashFromMagnet, makeStremioServerRequest } from "../stremio";

export default (async (_, { magnet, index }) => {
    const infoHash = `${getHashFromMagnet(magnet)}`;
    if (index !== undefined) {
        return await makeStremioServerRequest<TorrentStatsResponse>(`${infoHash}/${index}/stats.json`)
    }
    const stats = await makeStremioServerRequest<TorrentStatsResponse>(`${infoHash}/create`)
    return stats
}) satisfies IpcMainHandler<"getTorrentInfo">;

export interface TorrentStatsResponse {
    // infoHash: string;
    name: string;
    peers: number;
    unchoked: number;
    queued: number;
    unique: number;
    connectionTries: number;
    swarmPaused: boolean;
    swarmConnections: number;
    swarmSize: number;
    // selections: Selection[];
    // wires: Wire[];
    files: File[];
    downloaded: number;
    uploaded: number;
    downloadSpeed: number;
    uploadSpeed: number;
    // sources: Source[];
    peerSearchRunning: boolean;
    // opts: Opts;
}

interface File {
    path: string;
    name: string;
    length: number;
    offset: number;
    __cacheEvents: boolean;
}
