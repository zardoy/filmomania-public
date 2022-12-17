import { useState } from "react";
import { makeSchema, menuField, SettingsStore, SettingTypeGeneral } from "../../lib/electron-settings";

const settingsSchema = makeSchema({
    movieSearchEngine: {
        endpoint: {
            type: "input"
        },
        apiKey: {
            type: "input"
        }
    },
    player: {
        defaultPlayer: menuField({
            stremio: true,
            custom: true
        }, "stremio"),
        customPlayerExecutable: {
            type: "input",
            dependsOn: {
                property: "defaultPlayer",
                value: "custom"
            }
        },
        playerArgs: {
            type: "input",
        }
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
