export const defaultSettings = {
    searchEngine: {
        apiEndpoint: "",
        apiKey: ""
    },
    torrentTrackers: {
        activeProxy: ""
    }
};

export type SettingsSchema = typeof defaultSettings;
