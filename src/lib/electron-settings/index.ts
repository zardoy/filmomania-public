import { ipcMain, ipcRenderer } from "electron";
import { JSONSchema } from "json-schema-typed";
import _ from "lodash";
import { ReadonlyDeep } from "type-fest";
import createStore, { UseStore } from "zustand";

/**
 * @TODO
 * - [ ] Ensure that groups always created in settings
 * - [ ] Try to fix TypeScript errors
 * - [ ] Readonly settings
 */
import { filterValues, isStringOneOf } from "./util";

// using custom schema provider because ajv and electron-store doesn't allow to define strictly-typed schemas easily

// its actually settings ui schema creator

type MaybePromise<T> = T | Promise<T>

type SettingLabel = string | (() => string/*  | MaybePromise<string> */)

type SettingSchemaFieldTypes = {
    type: "menu",
    values: Record<string, SettingLabel | true>,
    defaultValue: string
    /** overrides label for **every** menu item, so when this is specified pass true in values */
    getMenuItemLabel?: (label: any) => string
} | {
    type: "slider"
    defaultValue: number
    /** @default 0 */
    min?: number
    /** @default 100 */
    max?: number
} | {
    type: "input"
    defaultValue?: string
} | {
    type: "toggle"
    defaultValue: boolean
} | {
    type: "label",
    text: string
} | {
    type: "button",
    text: string
    onClick?: () => unknown
} | {
    type: "custom",
    schema: JSONSchema
}

type CommonSettingProps = {
    /** @default undefined settingLabel is displayed as label. Used if need to save backward compatibility but change setting label */
    displayLabel?: string
    /** By default the setting is always visible and can be edited */
    dependsOn?: {
        /** Property name of the same group */
        property: string
        /** Only if property == value, the setting is visible and can be edited */
        value: string | boolean | number
    }
    // not supported yet
    // disabled: boolean | (() => boolean)
    // hint: string;
}

/** General type for any valid settings field */
export type SettingField = CommonSettingProps & SettingSchemaFieldTypes

/** General type for any valid settings schema */
export type SettingsSchema = {
    [settingsGroup: string]: {
        [settingLabel: string]: SettingField
    }
}

type SettingsSchemaToValues<S extends SettingsSchema> = {
    [G in keyof S]: {
        [SS in keyof S[G]]:
        S[G][SS] extends { type: "menu" } ? keyof S[G][SS]["values"] :
        S[G][SS] extends { defaultValue: infer U } ? U :
        S[G][SS]["type"] extends "input" ? string | undefined :
        S[G][SS]["type"] extends "custom" ? any : never
    }
}

type SettingsSchemaToDefaultValues<S extends SettingsSchema> = {
    [G in keyof S]: {
        [SS in keyof S[G]]:
        S[G][SS] extends { defaultValue: infer U } ? U :
        S[G][SS]["type"] extends "input" ? undefined : never
    }
}

/** Must be used for creating type=menu fields in settings schema */
export const menuField = <K extends Record<string, SettingLabel | true>, T extends keyof K>(valuesToLabelMap: K, defaultValue: T, additionalProperties: CommonSettingProps & { getMenuItemLabel?: (label: keyof K) => string } = {}) => ({
    type: "menu" as const,
    values: valuesToLabelMap,
    defaultValue,
    ...additionalProperties
})

// export type GetSettingTypeFactory<T extends SettingsSchema> =

// todo factory types???//

export type SettingTypeGeneral<
    S extends SettingsSchema,
    G extends keyof S,
    SS extends keyof S[G]
    > =
    S[G][SS] extends { type: "menu" } ? keyof S[G][SS]["values"] :
    S[G][SS] extends { defaultValue: infer U } ? U :
    S[G][SS]["type"] extends "input" ? string | undefined : never

export const makeSchema = <T extends SettingsSchema>(settingsSchema: T) => settingsSchema

// todo-high refactor types
export class SettingsStore<S extends SettingsSchema> extends EventTarget {
    static throwInitError = () => {
        throw new Error(`Call init on store first`)
    }

    public windowIpcMain!: Electron.BrowserWindow

    private static ipcMainHandlerNames = {
        syncSettings: "electron-settings--sync-settings",
        setSetting: "electron-settings--set-setting"
    }

    private static ipcRendererEventNames = {
        updateSetting: "electron-settings--update-user-setting",
        updateAllSetting: "electron-settings--update-all-settings"
    }

    // todo: auto generate getters
    // public settings
    public settings!: ReadonlyDeep<SettingsSchemaToValues<typeof this["settingsSchema"]>>
    public defaultValues!: ReadonlyDeep<SettingsSchemaToDefaultValues<typeof this["settingsSchema"]>>
    // public userValues!: ReadonlyDeep<SettingsSchemaToValues<typeof this["settingsSchema"]>>

    // public useStore: UseStore<SettingsSchemaToValues<typeof this["settingsSchema"]>> | undefined

    // todo why can use async
    constructor(
        public settingsSchema: S
    ) {
        super();
    }

    /** **Must** be called in both process. Must be initialized in main process before creating window with renderer. */
    async init() {
        this.defaultValues = _.mapValues(this.settingsSchema, fields => {
            const obj = _.mapValues(fields, field => "defaultValue" in field ? field.defaultValue : undefined)
            for (let [key, value] of Object.entries(obj)) {
                if (value === undefined) delete obj[key]
            }
            return obj
        }) as any

        type GSV = [group: string, setting: string, value: any]
        type SetSettingFn = (group: string, setting: string, value: any) => void
        /** Updates setting on **current** side */
        const updateStoreSetting: SetSettingFn = (g, s, v) => {
            (this.settings[g] ??= {})[s] = v
            // ;(this.userValues[g] ??= {})[s] = v
            // if (this.useStore) {
            //     this.useStore!.setState(oldState => {
            //         const { ...settingsState } = oldState
            //         // eslint-disable-next-line no-extra-parens
            //         ;((settingsState[g as keyof S] ??= {} as any) as any)[s] = v;
            //     })
            // }
            this.dispatchEvent(new Event("update"))
        }
        if (ipcMain) {
            const fs = (await import("fs")).default
            const path = (await import("path")).default
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const {app} = require("electron")
            let attemp = 0
            let innerChange = false
            const initInner = async () => {
                const filePath = path.join(app.getPath("userData"), "settings.json")
                console.log("settings file path", filePath)
                try {
                    attemp++
                    const ElectronStore = (await import("electron-store")).default
                    const store = new ElectronStore({
                        schema: Object.fromEntries(Object.entries(this.settingsSchema).map(([groupName, settingProps]: [any, Record<string, SettingField>]): [string, JSONSchema] => {
                            return [groupName, {
                                type: "object",
                                additionalProperties: false,
                                properties: _.mapValues(
                                    filterValues(settingProps, (_key, value) => !isStringOneOf(value.type, ["label", "button"])),
                                    (setting: Extract<SettingField, { defaultValue?: any, schema?: any }>): JSONSchema => {
                                        const schemaItem = ((): JSONSchema => {
                                            switch (setting.type) {
                                                case "input":
                                                case "menu":
                                                    return {
                                                        type: "string"
                                                    }
                                                case "slider":
                                                    // eslint-disable-next-line no-case-declarations
                                                    const { min: minimum = 0, max: maximum = 100 } = setting
                                                    return {
                                                        type: "number",
                                                        minimum,
                                                        maximum
                                                    }
                                                case "toggle":
                                                    return {
                                                        type: "boolean"
                                                    }
                                                case "custom":
                                                    return {
                                                        ...setting.schema
                                                    }
                                            }
                                        })()
                                        // schemaItem.default = setting.defaultValue;
                                        return schemaItem
                                    }
                                )
                            }]
                        })),
                        name: "settings",
                        watch: true
                    })
                    store.onDidAnyChange(newSettings => {
                        if (innerChange) {
                            innerChange = false
                            return
                        }
                        console.log("external change update")
                        this.windowIpcMain!.webContents.send(SettingsStore.ipcRendererEventNames.updateAllSetting, newSettings)
                    })

                    // this.userValues = store.store as any
                    this.settings = _.defaultsDeep({}, store.store, this.defaultValues)

                    ipcMain.handle(SettingsStore.ipcMainHandlerNames.syncSettings, () => this.settings)

                    const setSettingMain: SetSettingFn = (group, setting, value) => {
                        updateStoreSetting(group, setting, value)
                        innerChange = true
                        store.set(`${group}.${setting}`, value)
                    }
                    ipcMain.handle(SettingsStore.ipcMainHandlerNames.setSetting, (_e, { group, setting, value }) =>
                        setSettingMain(group, setting, value))

                    this.set = ((...gsv: GSV) => {
                        this.windowIpcMain.webContents.send(SettingsStore.ipcRendererEventNames.updateSetting, ...gsv)
                        setSettingMain(...gsv)
                    }) as any
                } catch (err: any) {
                    if (attemp >= 2) throw err
                    // is it okay?
                    // todo-moderate use internals of ajv !!!
                    // eslint-disable-next-line prefer-destructuring
                    const message: string = err.message
                    const invalidProperties = new Set<string>()
                    for (const regexpEntry of message.matchAll(/`(?<property>.+?)` must be/g)) {
                        const property = regexpEntry.groups!.property!
                        invalidProperties.add(property)
                    }
                    if (!invalidProperties.size) throw err
                    // invalidProperties.forEach([] => {
                    //     modifyJsonFile(filePath, json => json[])
                    // });

                    // Either fix the error manually or click the button below.
                    console.error(message)

                    await fs.promises.unlink(filePath)
                    return await initInner()
                }
            }
            await initInner()
        } else {
            this.set = ((group, setting, value) => {
                void ipcRenderer.invoke(SettingsStore.ipcMainHandlerNames.setSetting, { group, setting, value })
                updateStoreSetting(group, setting, value)
            }) as any
            ipcRenderer.on(SettingsStore.ipcRendererEventNames.updateSetting, (_e, ...args: GSV) => {
                console.log("capture setting update")
                return updateStoreSetting(...args);
            })

            this.settings = await ipcRenderer.invoke(SettingsStore.ipcMainHandlerNames.syncSettings)
            ipcRenderer.on(SettingsStore.ipcRendererEventNames.updateAllSetting, (_e, newSettings) => {
                this.settings = newSettings
                this.dispatchEvent(new Event("update"))
            })
            // this.useStore = createStore(() => this.settings as any)
        }
    }

    // getUserValue<
    //     S extends SettingsSchema = typeof this["settingsSchema"],
    //     G extends keyof S = keyof S,
    //     SS extends keyof S[G] = keyof S[G]
    // >(group: G, setting: SS):
    //     (S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
    //         S[G][SS] extends { defaultValue: infer U; } ? U :
    //         S[G][SS]["type"] extends "input" ? string | undefined : void) | undefined {
    //     // return settingsObj?.[group]?.[setting];
    //     return {} as any;
    // }

    //     get<
    //         S extends SettingsSchema = typeof this["settingsSchema"],
    //         G extends keyof S = keyof S,
    //         SS extends keyof S[G] = keyof S[G]
    //     >(group: G, setting: SS):
    //          {
    //         //@ts-ignore
    //         return this.getUserValue(group, setting) ?? settingsSchema[group][setting]["defaultValue"];
    //     }

    //     isSet<
    //         S extends SettingsSchema = typeof this["settingsSchema"],
    //         G extends keyof S = keyof S,
    //         SS extends keyof S[G] = keyof S[G]
    //     >(group: G, setting: SS): boolean {
    //         return this.getUserValue(group as any, setting as any) !== undefined;
    //     }

    // Actually handles setting the new value on the setting on this process side
    set<
        S extends SettingsSchema = typeof this["settingsSchema"],
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G],
        V extends S[G][SS] extends { type: "menu" } ? keyof S[G][SS]["values"] :
        // annoying ts
        S[G][SS] extends { defaultValue: infer U } ? U :
        S[G][SS]["type"] extends "input" ? string | undefined : S[G][SS]["type"] extends "custom" ? any : void = S[G][SS] extends { type: "menu" } ? keyof S[G][SS]["values"] :
        S[G][SS] extends { defaultValue: infer U } ? U :
        S[G][SS]["type"] extends "input" ? string | undefined :
        S[G][SS]["type"] extends "custom" ? any : void
    >(group: G, setting: SS, newValue: V) {
        SettingsStore.throwInitError()
    }
}
