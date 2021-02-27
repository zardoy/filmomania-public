import Store from "electron-store";

// todo-moderate multiple schema levels

// todo handle read & parse errors
export const settingsStore = new Store({
    accessPropertiesByDotNotation: false,
    name: "settings",
    schema: {
        searchEngineApiEndpoint: {
            type: "string"
        },
        searchEngineApiKey: {
            type: "string"
        },
        generalDefaultPlayer: {//sodaPlayer or system
            type: "string"
        },
        internalActiveProxy: {
            type: "string"
        }
    }
});
