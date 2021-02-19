import { EngineStatus } from "ace-connector";

export type ExternalPlayer = {
    name: string;
    // icon
    version: string;
    path: string;
};
type ConnectableModuleInfo<T extends object> = {
    connected: false;
} | ({
    connected: true;
} & T);

export type ExternalModulesInfo = {
    aceStream: EngineStatus;
    defaultExternalPlayer: ConnectableModuleInfo<ExternalPlayer>;
    foundExternalPlayers: ExternalPlayer[];
};
