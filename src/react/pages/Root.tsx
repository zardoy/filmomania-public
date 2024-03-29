import React, { useMemo, useState } from "react";

import { HashRouter, Link as RouterLink, Route, Switch } from "react-router-dom";

import { Button, CircularProgress, createTheme, CssBaseline, ThemeProvider, Typography, useMediaQuery } from "@mui/material";
import { blue, lightBlue } from "@mui/material/colors";

import CenterContent from "../components/CenterContent";
import ElectronEvents from "../components/ElectronEvents";
import ErrorBoundary from "../components/ErrorBoundary";
import Overlay from "../components/Overlay";
import WithBackButton from "../components/WithBackButton";
import { useSettings } from "../electron-shared/settings";
import { pageURLS } from "../electron-shared/URLS";
import HomePage from "./Home";
import FilmPage from "./Movie";
import WelcomePage from "./Welcome/Welcome";
import { css, Global } from "@emotion/react";
import { proxy, useSnapshot } from "valtio";
import { TorrentSelectFileDialog } from "./TorrentSelectFileDialog";
import PlaybackHistory from "./PlaybackHistory";

interface ComponentProps {
}

export const showModalLoader = proxy({ value: false, })
export const currentModalCancel = { value: null as (() => any) | null }

let App: React.FC<ComponentProps> = () => {
    const settings = useSettings()
    const { value: showLoader } = useSnapshot(showModalLoader)

    const [showWelcomePage, setShowWelcomePage] = useState(() => {
        const { apiKey, endpoint } = settings.movieSearchEngine
        return !apiKey || !endpoint
    })

    // MATERIAL-UI THEME
    const isDarkTheme = useMediaQuery(`(prefers-color-scheme: dark)`)
    const muiTheme = useMemo(
        () => createTheme({
            palette: {
                // type: isDarkTheme ? "dark" : "light",
                mode: "dark",
                primary: lightBlue,
                secondary: blue
            }
        }),
        [isDarkTheme]
    )

    return <ThemeProvider theme={muiTheme}>
        <Global styles={{
            "button:focus": {
                outline: "none"
            }
        }} />
        <Global styles={css`
            ${settings.ui.cssOverrides ?? ""}
        `} />
        {showLoader && <div className='fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-40' onClick={() => currentModalCancel.value?.()}>
            <CircularProgress />
        </div>}
        <CssBaseline />
        <div className="select-none">
            <ErrorBoundary>
                <HashRouter>
                    <ElectronEvents />
                    <Overlay />
                    {
                        showWelcomePage ? <WelcomePage onSetupFinish={() => {
                            setShowWelcomePage(false)
                        }} /> :
                            <Switch>
                                <Route path="/" exact>
                                    <HomePage />
                                </Route>
                                <Route path={pageURLS.FILM}>
                                    <WithBackButton>
                                        <FilmPage />
                                    </WithBackButton>
                                </Route>
                                <Route path={pageURLS.FILM}>
                                    <WithBackButton>
                                        <FilmPage />
                                    </WithBackButton>
                                </Route>
                                <Route path={pageURLS.PLAYBACK_HISTORY}>
                                    <PlaybackHistory />
                                </Route>
                                <Route path="*">
                                    <CenterContent>
                                        <Typography variant="h3">404</Typography>

                                        <Button component={RouterLink} to="/">GO HOME</Button>
                                    </CenterContent>
                                </Route>
                            </Switch>
                    }
                </HashRouter>
            </ErrorBoundary>
        </div>
        <TorrentSelectFileDialog />
    </ThemeProvider>
}

export default App
