import { Paper, ClickAwayListener, MenuList, ListItemIcon, Typography, MenuItem } from "@mui/material";
import React from "react";

// eslint-disable-next-line react/display-name
export default ({ items, onClose, ...props }: { items: { label: string, icon?: JSX.Element, action: (e) => any, close?: boolean }[], onClose: () => any }) => {
    return <Paper {...props}>
        <ClickAwayListener onClickAway={onClose}>
            <MenuList>
                {
                    items.map(({ action, label, close = true, icon = null }) =>
                        <MenuItem onClick={e => {
                            action(e)
                            if (close) onClose()
                        }} key={label}>
                            <ListItemIcon>
                                {icon}
                            </ListItemIcon>
                            <Typography variant="inherit">{label}</Typography>
                        </MenuItem>
                    )
                }
            </MenuList>
        </ClickAwayListener>
    </Paper>
}
