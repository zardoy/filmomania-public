import { useState } from "react";
import { makeSchema, menuField, SettingsStore, SettingTypeGeneral } from "../../lib/electron-settings";

const settingsSchema = makeSchema({
    movieSearchEngine: {
        endpoint: {
            type: "input"
        },
        // filmItemEndpoint: {
        //     type: 'input',
        // },
        apiKey: {
            type: "input"
        }
    },
    player: {
        defaultPlayer: menuField({
            stremio: true,
            custom: true,
            native: true
        }, "stremio"),
        // when player is custom
        stremioServerUrl: {
            type: "input",defaultValue: "127.0.0.1:11470"
        },
        stremioExec: {
            type: "input",
        },
        customPlayerExecutable: {
            type: "input",
            dependsOn: {
                property: "defaultPlayer",
                value: "custom"
            }
        },
    },
    internal: {
        activeProxies: {
            type: "input",
        }
    }
})


export type SettingType<
    G extends keyof typeof settingsSchema,
    SS extends keyof typeof settingsSchema[G]
    > = SettingTypeGeneral<typeof settingsSchema, G, SS>

export const settingsStore = new SettingsStore(settingsSchema)

export const useSettings = () => {
    const [settings, setSettings] = useState(settingsStore.settings)

    settingsStore.addEventListener("update", () => {
        setSettings(settingsStore.settings)
    })
    return settings
}
