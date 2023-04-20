import React, { Suspense } from "react"
import ReactDom from "react-dom"
import Root from "./pages/Root"
import { settingsStore } from "./electron-shared/settings"
import i18next from "i18next"
import Backend, { HttpBackendOptions } from "i18next-http-backend";
import { initReactI18next } from "react-i18next"

import "tailwindcss/tailwind.css"
import "./main.css"
import "./dragndrop"
import "./globalKeybindings"
import { bindPlayerStateListeners } from "./playHistory"

import "@fontsource/roboto"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import { typedIpcRequest } from "./utils/ipc"

await settingsStore.init()
bindPlayerStateListeners()

if (import.meta.env.DEV) {
    const url = localStorage.getItem("dev:lastSavedUrl")
    if (url) location.href = url
    //@ts-ignore
    window.seturl = () => {
        localStorage.setItem("dev:lastSavedUrl", location.href)
    }
}
// mpv command like await mpv('get_property', 'audio-params')
//@ts-ignore
window.mpv = async (...args) => {
    return await typedIpcRequest.mpvCommand({ args })
}
//@ts-ignore
window.reloadHooksFile = () => {
    return typedIpcRequest.reloadHooksFile()
}

void i18next
    .use(Backend)
    .use(initReactI18next)
    .init({
        lng: navigator.language.split("-")[0]!,
        // lng: "ru",
        // preload: ["ru", "en"],
        fallbackLng: "en",
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false
        },
        // defaultNS: "app",
        lowerCaseLng: true,

        backend: {
            loadPath: "./locales/{{lng}}.json",
        } satisfies HttpBackendOptions,
    })


// if (import.meta.env.MODE === "development") console.clear();

// TODO! display loader!
ReactDom.render(<Suspense fallback={null}>
    <Root />
</Suspense>, document.getElementById("root"))
