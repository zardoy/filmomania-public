import { List } from "@mui/material"
import React, { useRef } from "react"
import { focusable, } from "tabbable"
import { useKeyPress } from "../utils/react"

// eslint-disable-next-line react/display-name
export default ({ children, ...rootProps }: {} & React.ComponentProps<typeof List>) => {
    const containerRef = useRef<any>()

    useKeyPress(["ArrowDown", "ArrowUp"], e => {
        const dir = e.code === "ArrowDown" ? 1 : -1
        e.preventDefault()
        const elements = focusable(containerRef.current!)
        const focusedElemIndex = elements.findIndex(element => element === document.activeElement);
        if (focusedElemIndex === -1) return
        const nextElem = elements[focusedElemIndex + dir]
        nextElem?.focus()
    })

    return <List ref={containerRef} {...rootProps}>
        {children}
    </List>
}
