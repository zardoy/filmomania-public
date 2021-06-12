// using custom schema provider because ajv and electron-store doesn't allow to define strictly-typed schemas easily

// its actually settings ui schema creator

type MaybePromise<T> = T | Promise<T>;

type SettingLabel = string | (() => string/*  | MaybePromise<string> */);

type SettingSchemaFieldTypes = {
    type: "menu",
    values: Record<string, SettingLabel | true>,
    defaultValue: string;
    /** overrides label for **every** menu item, so when this is specified pass true in values */
    getMenuItemLabel?: (label: any) => string;
} | {
    type: "slider";
    defaultValue: number;
    /** @default 0 */
    min?: number;
    /** @default 100 */
    max?: number;
} | {
    type: "input";
    defaultValue?: string;
} | {
    type: "toggle";
    defaultValue: boolean;
} | {
    type: "label",
    text: string;
} | {
    type: "button",
    text: string;
    onClick?: () => unknown;
};

type CommonSettingFields = {
    /** @default settingLabel is displayed as label. Used if need to save backward compatibility but change setting label */
    displayLabel?: string;
    /** By default the setting is always visible and can be edited */
    dependsOn?: {
        /** Property name of the same group */
        property: string;
        /** Only if property == value, the setting is visible and can be edited */
        value: string | boolean | number;
    };
    // not supported yet
    // disabled: boolean | (() => boolean)
    // hint: string;
};

export type SettingField = CommonSettingFields & SettingSchemaFieldTypes;

export type SettingsSchema = {
    [settingsGroup: string]: {
        [settingLabel: string]: SettingField;
    };
};

const createSettingsSchema = <T extends SettingsSchema>(params: T) => params;

const menuField = <K extends Record<string, SettingLabel | true>, T extends keyof K>(valuesToLabelMap: K, defaultValue: T, additionalProperties: CommonSettingFields & { getMenuItemLabel?: (label: keyof K) => string; } = {}) => ({
    type: "menu" as const,
    values: valuesToLabelMap,
    defaultValue: defaultValue,
    ...additionalProperties
});

export const settingsSchema = createSettingsSchema({
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
        },
        test: {
            type: "label",
            text: "Hey there!"
        },
    },
    internal: {
        activeProxy: {
            type: "input",
        }
    }
});

type SettingTypeBasic<
    S extends SettingsSchema,
    G extends keyof S,
    SS extends keyof S[G]
    > =
    S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
    S[G][SS] extends { defaultValue: infer U; } ? U :
    S[G][SS]["type"] extends "input" ? string | undefined : never;

export type SettingType<
    G extends keyof typeof settingsSchema,
    SS extends keyof typeof settingsSchema[G]
    > = SettingTypeBasic<typeof settingsSchema, G, SS>;

export class SettingsStore {
    constructor(
        private getter: (path: string) => Promise<any>,
        private setter: (path: string, newValue: any) => Promise<void>
    ) { }

    async get<
        S extends SettingsSchema = typeof settingsSchema,
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G]
    >(group: G, setting: SS):
        Promise<S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
            S[G][SS] extends { defaultValue: infer U; } ? U :
            S[G][SS]["type"] extends "input" ? string | undefined : void> {
        const settingValue = await this.getter(`${group}.${setting}`);
        //@ts-ignore
        return settingValue ?? settingsSchema[group][setting]["defaultValue"];
    }

    async getUserValue<
        S extends SettingsSchema = typeof settingsSchema,
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G]
    >(group: G, setting: SS):
        Promise<(S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
            S[G][SS] extends { defaultValue: infer U; } ? U :
            S[G][SS]["type"] extends "input" ? string | undefined : void) | undefined> {
        return await this.getter(`${group}.${setting}`);
    }

    async isSet<
        S extends SettingsSchema = typeof settingsSchema,
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G]
    >(group: G, setting: SS): Promise<boolean> {
        const settingValue = await this.getter(`${group}.${setting}`);
        return settingValue !== undefined;
    }

    async reset<
        S extends SettingsSchema = typeof settingsSchema,
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G]
    >(group: G, setting: SS): Promise<boolean> {
        const settingValue = await this.getter(`${group}.${setting}`);
        return settingValue !== undefined;
    }

    async set<
        S extends SettingsSchema = typeof settingsSchema,
        G extends keyof S = keyof S,
        SS extends keyof S[G] = keyof S[G],
        V extends S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
        // annoying ts
        S[G][SS] extends { defaultValue: infer U; } ? U :
        S[G][SS]["type"] extends "input" ? string | undefined : void = S[G][SS] extends { type: "menu"; } ? keyof S[G][SS]["values"] :
        S[G][SS] extends { defaultValue: infer U; } ? U :
        S[G][SS]["type"] extends "input" ? string | undefined : void
    >(group: G, setting: SS, newValue: V) {
        await this.setter(`${group}.${setting}`, newValue);
    }
}
