import React from "react";
import ReactDom from "react-dom";
import App from "./App";
import "./main.css";

import { ipcRenderer } from "electron";

import "@fontsource/roboto";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

if (import.meta.env.MODE === "development") console.clear();

console.log(ipcRenderer);

ReactDom.render(<App />, document.getElementById("root"));
