import { useState } from "react";
import { makeSchema, menuField, SettingsStore, SettingTypeGeneral } from "../../lib/electron-settings";

const settingsSchema = makeSchema({
    core: {
        autoUpdate: menuField({
            disable: true,
            enable: true
        }, "enable")
    },
    movieSearchEngine: {
        endpoint: {
            type: "input"
        },
        // filmItemEndpoint: {
        //     type: 'input',
        // },
        apiKey: {
            type: "input"
        },
        entryIdEndpoint: {
            // default set where it is used
            type: "input",
        },
    },
    player: {
        defaultPlayer: menuField({
            stremio: true,
            custom: true,
            native: true
        }, "stremio"),
        // when player is custom
        stremioServerUrl: {
            type: "input",defaultValue: "http://127.0.0.1:11470"
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
    },
    ui: {
        trackerSorting: menuField({
            bySize:true,
            bySeeds: true
        }, "bySize"),
        cssOverrides: {
            type: "input",
        }
    },
    dev: {
        counter: {
            type: "custom",
            schema: {
                type: "number"
            }
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
