import { useState } from "react";
import { makeSchema, menuField, SettingsStore, SettingTypeGeneral } from "../../lib/electron-settings";

const settingsSchema = makeSchema({
    core: {
        autoUpdate: {
            ...menuField({
                disable: true,
                enable: true
            }, "enable"),
            descrioption: "Not implemented for now, but can be disabled for future",
        },
        handleMagnetProtocol: {
            type: "toggle",
            defaultValue: false,
        }
    },
    movieSearchEngine: {
        endpoint: {
            type: "input"
        },
        entryIdEndpoint: {
            // default set where it is used
            type: "input",
        },
        apiKey: {
            type: "input"
        }
    },
    player: {
        defaultPlayer: menuField({
            stremio: true,
            custom: true,
            mpv: true,
            nativeMangetApp: true,
            native: true
        }, "mpv"),
        stremioServerUrl: {
            type: "input", defaultValue: "http://127.0.0.1:11470"
        },
        stremioExec: {
            type: "input",
        },
        playerExecutable: {
            type: "input",
            descrioption: "Can be overriden when player is custom or mpv. By default the best installation is choicen"
        },
        killPrevious: {
            type: "toggle",
            defaultValue: true,
            descrioption: "Ensure previous instance is killed before starting a new one",
        },
        fullscreen: {
            type: "toggle",
            defaultValue: true
        },
        enableAdvancedOverlay: {
            type: "toggle",
            descrioption: "(windows only) Wether to enable custom overlay with stats and time when in mpv fullscreen",
            defaultValue: true,
        },
        advancedOverlayLoadStats: {
            type: "toggle",
            defaultValue: false,
        },
        // TODO presets in welcome
        remoteUiControl: {
            type: "toggle",
            defaultValue: false,
        },
        remoteUiControlPort: {
            type: "custom",
            schema: {
                default: 3720,
                type: "number",
            }
        },
        rememberFilmPosition: {
            type: "toggle",
            defaultValue: true
        }
    },
    builtinStremioServer: {
        // todo enable by deafult and add auto startup feature
        enabled: {
            type: "toggle",
            defaultValue: true
        },
        overrideRootPath: {
            type: "input",
            descrioption: "When builtin server is used, override path to where server-settings.json and cache is stored (relative to userData dir), you should override cache size & location & other settings in that file. Default (when empty): %APPDATA%\\stremio\\stremio-server",
            defaultValue: ""
        }
    },
    internal: {
        activeProxies: {
            type: "input",
        }
    },
    ui: {
        trackerSorting: menuField({
            bySize: true,
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
    },
    providers: {
        rutorInfoSearchQuery: {
            type: "input",
            defaultValue: "${ruEnName} ${year}",
            descrioption: "Default value can be changed over time. Other available placeholders: ${enRuName} which prefers original name first"
        },
        rutorInfoRequestUrl: {
            type: "input",
            defaultValue: "http://rutor.info/search/0/${category_number_fake}/100/2/${searchQuery}",
            descrioption: "Default value can be changed over time."
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
