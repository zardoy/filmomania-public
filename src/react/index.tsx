import React from "react"
import ReactDom from "react-dom"
import Root from "./pages/Root"
import { settingsStore } from "./electron-shared/settings"

import "tailwindcss/tailwind.css"

import "@fontsource/roboto"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"

await settingsStore.init()

// if (import.meta.env.MODE === "development") console.clear();

ReactDom.render(<Root />, document.getElementById("root"))
