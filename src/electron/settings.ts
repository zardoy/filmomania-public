import type { JSONSchema } from "json-schema-typed";

import ElectronStore from "electron-store";
import _ from "lodash";

import { SettingField, settingsSchema, SettingsStore } from "../react/electron-shared/settings";

const filterValues = <K extends any>(obj: Record<string, K>, filterFn: (key: string, value: K) => boolean) => {
    return Object.fromEntries(
        Object.entries(obj).filter(arr => filterFn(...arr))
    );
};

const isStringOneOf = <T extends string>(input: T, positiveVariants: T[]) => positiveVariants.includes(input);

export const userSettingsStore = new ElectronStore({
    schema: Object.fromEntries(Object.entries(settingsSchema).map(([groupName, settingProps]: [string, Record<string, SettingField>]): [string, JSONSchema] => {
        return [groupName, {
            type: "object",
            additionalProperties: false,
            properties: _.mapValues(
                filterValues(settingProps, (_key, value) => !isStringOneOf(value.type, ["label", "button"])),
                (setting: Extract<SettingField, { defaultValue?: any; }>): JSONSchema => {
                    const schemaItem = ((): JSONSchema => {
                        switch (setting.type) {
                            case "input":
                                return {
                                    type: "string"
                                };
                            case "menu":
                                return {
                                    type: "string"
                                };
                            case "slider":
                                const { min: minimum = 0, max: maximum = 100 } = setting;
                                return {
                                    type: "number",
                                    minimum,
                                    maximum
                                };
                            case "toggle":
                                return {
                                    type: "boolean"
                                };
                        }
                    })();
                    // schemaItem.default = setting.defaultValue;
                    return schemaItem;
                }
            )
        }];
    }))
});

export const settingsStore = new SettingsStore(
    async (path) => userSettingsStore.get(path),
    async (path, newValue) => userSettingsStore.set(path, newValue)
);

/*
catch (err) {
    // is it okay?
    // todo-moderate use internals of ajv !!!
    const message: string = err.message;
    const invalidProperties = new Set<string>();
    for (const regexpEntry of message.matchAll(/`(?<property>.+?)` must be/g)) {
        const property = regexpEntry.groups!.property!;
        invalidProperties.add(property);
    }
    if (!invalidProperties.size) throw err;
    console.log(invalidProperties);

    // Either fix the error manually or click the button below.
}

app.on("ready", () => {
    console.log(app.getPath("userData"));
    store.set("grouped.player", "fds");
    const value = store.get("grouped.player");

    console.log(value);
});;
*/
