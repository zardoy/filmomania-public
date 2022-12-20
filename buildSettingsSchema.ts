import { getRootPropertiesJsonSchema } from './src/lib/electron-settings'
import { settingsStore } from './src/react/electron-shared/settings'
import fs from 'fs'

const props = getRootPropertiesJsonSchema(settingsStore.settingsSchema)
fs.writeFileSync('./build/settingsSchema.json', JSON.stringify({
    title: 'Settings',
    type: 'object',
    // allowTrailingCommas
    properties: { ...props, dev: undefined },
}), 'utf8')
