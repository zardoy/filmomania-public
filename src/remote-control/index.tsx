/// <reference types="vite/client" />

import React from "react"
import ReactDOM from "react-dom"
import RemoteControl, { setPlaybackTime, uiState } from "./RemoteControl"

import "@fontsource/roboto"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"

import "tailwindcss/tailwind.css"
import FastClick from "fastclick"
import { createTheme, ThemeProvider } from "@mui/material"

FastClick(document.body, {});

interface RemoteUiConfig {
    doubleClickTime: number,
}

const config: RemoteUiConfig = {
    doubleClickTime: 10,
}

let fastSeekDisappearTimeout
document.addEventListener("dblclick", e => {
    const target = e.target as HTMLElement
    if (!target.matches(".root-elem")) return
    if (!uiState.title) return
    const isBackwards = e.clientX < document.documentElement.offsetWidth / 2
    if (fastSeekDisappearTimeout) clearTimeout(fastSeekDisappearTimeout)
    const addTime = config.doubleClickTime;
    uiState.fastSeek = {
        isBackwards,
        time: addTime
    }
    const addTimeDir = addTime * (isBackwards ? -1 : 1)
    setPlaybackTime(uiState.time + addTimeDir)
    fastSeekDisappearTimeout = setTimeout(() => {
        uiState.fastSeek = null
        fastSeekDisappearTimeout = undefined
    }, 3000)
})

const muiTheme = createTheme({
    palette: {
        mode: "dark"
    }
})

ReactDOM.render(<ThemeProvider theme={muiTheme}>
    <RemoteControl />
</ThemeProvider>, document.querySelector("#root")!)
