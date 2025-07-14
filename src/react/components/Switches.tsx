import { Box } from '@mui/material'
import React from 'react'
import { useSnapshot } from 'valtio'
import { settingsStore, useSettings } from '../electron-shared/settings'
import { typedIpcRequest } from '../utils/ipc'

const SettingRenderer = ({ value, onValueChange = (newVal) => { } }) => {
    if (typeof value === 'boolean') {
        return <span
            className={`${value ? 'text-green-500' : 'text-red-500'}`}
            onClick={() => {
                onValueChange(!value)
            }}
        >{value ? 'On' : 'Off'}</span>
    }
    return null
}

export default () => {
    const settings = useSettings()

    return <div className='flex flex-col gap-2 w-full items-end mb-4 text-lg'>
        <div className='p-2 bg-gray-800 rounded-lg' onClick={() => {
            settingsStore.set('core', 'handleMagnetProtocol', !settings.core.handleMagnetProtocol as false)
        }}>
            Magnet protocol: <SettingRenderer value={settings.core.handleMagnetProtocol} onValueChange={(val) => {

            }} />
        </div>
        <div className='p-2 bg-gray-800 rounded-lg' onClick={() => {
            settingsStore.set('player', 'remoteUiControl', !settings.player.remoteUiControl as false)
        }}>
            Remote UI: <SettingRenderer value={settings.player.remoteUiControl} onValueChange={(val) => {

            }} />
        </div>
        <div className='p-2 bg-gray-800 rounded-lg' onClick={async () => {
            const newValue = !settings.core.startupOnBoot
            try {
                await typedIpcRequest.setStartupOnBoot({ enabled: newValue })
                settingsStore.set('core', 'startupOnBoot', newValue as false)
            } catch (error) {
                console.error('Failed to set startup on boot:', error)
                // Revert the setting if the operation failed
                settingsStore.set('core', 'startupOnBoot', !newValue as false)
            }
        }}>
            Startup on boot: <SettingRenderer value={settings.core.startupOnBoot} onValueChange={(val) => {

            }} />
        </div>
    </div>
}
