import { typedIpcRenderer } from "typed-ipc";
import { handleTorrentClick } from "./pages/Movie"

// shift+f5 is a global shortcut for toggling overlay when enabled

// here we handle only in-app global shortcuts

window.addEventListener("keydown", async e => {
    const target = e.target as HTMLElement
    if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === "KeyV") {
        const text = await navigator.clipboard.readText();
        if (text.startsWith("magnet:")) {
            await handleTorrentClick({
                magnet: text,
                title: "",
            })
        }
    }
})

typedIpcRenderer.addEventListener("playManget", async (e, { magnet }) => {
    await handleTorrentClick({
        magnet,
        title: "",
    })
})
