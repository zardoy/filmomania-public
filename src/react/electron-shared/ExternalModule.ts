export type ExternalPlayer = {
    name: string;
    version: string;
    path: string;
};
type ConnectableModuleInfo<T extends object> = {
    connected: false;
} | ({
    connected: true;
} & T);

export type ExternalModulesInfo = {
    aceStream: ConnectableModuleInfo<{ version: string; }>;
    externalPlayer: ConnectableModuleInfo<ExternalPlayer>;
};
