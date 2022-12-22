/** @autoImportFormat */

import _ from "lodash"
import useTypedEventListener from "use-typed-event-listener"
import { ensureArray } from "@zardoy/utils"
import { tabbable } from "tabbable";

export const focusNextElemOnPage = () => {
    const elems = tabbable(document.body);
    const index = elems.findIndex(element => element === document.activeElement)
    if (index === -1) return
    elems[index + 1]?.focus()
}

export const useKeyPress = (desiredCodes: string | string[], handler: (e) => any) => {
    useTypedEventListener(window, "keydown", e => {
        const { code, altKey, ctrlKey, metaKey, shiftKey, } = e
        const modifiers = { altKey, ctrlKey, metaKey, shiftKey }
        if (!_.isEqual({ altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }, modifiers)) return
        if (!ensureArray(desiredCodes).includes(code)) return
        handler(e)
    })
}
