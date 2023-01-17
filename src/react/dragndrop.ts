import { handleTorrentOpen } from "./pages/TorrentSelectFileDialog";
import { typedIpcRequest } from "./utils/ipc";

["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"].forEach(event => {
    window.addEventListener(event, (e: any) => {
        if (e.dataTransfer && !e.dataTransfer.types.includes("Files")) {
            // e.dataTransfer.effectAllowed = "none"
            return
        }
        e.preventDefault()
    });
});
window.addEventListener("drop", async e => {
    if (!e.dataTransfer?.files.length) return
    const { files } = e.dataTransfer
    const file = files.item(0)!
    const buffer = await file.arrayBuffer();
    const data = await typedIpcRequest.parseTorrentFile({ buffer })
    handleTorrentOpen({ ...data, filmId: undefined })
})
