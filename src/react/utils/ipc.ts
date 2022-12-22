import { IpcMainRequests } from "typed-ipc";
import { ipcRenderer } from "electron"

export const typedIpcRequest = new Proxy({} as { [K in keyof IpcMainRequests]: (variables: IpcMainRequests[K] extends { variables: infer U } ? U : void) => Promise<IpcMainRequests[K] extends { response: infer U } ? U : void> }, {
    get(_target, p: string) {
        return arg => ipcRenderer.invoke(p, arg)
    },
})
