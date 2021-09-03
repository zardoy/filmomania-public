import React, { useMemo, useState } from "react";

import { HashRouter, Link as RouterLink, Route, Switch } from "react-router-dom";

import { Global } from "@emotion/react";
import { Button, createTheme, CssBaseline, ThemeProvider, Typography, useMediaQuery } from "@mui/material";
import { blue, lightBlue } from "@mui/material/colors";

import CenterContent from "../components/CenterContent";
import ElectronEvents from "../components/ElectronEvents";
import ErrorBoundary from "../components/ErrorBoundary";
import Overlay from "../components/Overlay";
import WithBackButton from "../components/WithBackButton";
import { settingsStore } from "../electron-shared/settings";
import { pageURLS } from "../electron-shared/URLS";
import HomePage from "./Home";
import FilmPage from "./Movie";
import Search from "./Search";
import WelcomePage from "./Welcome/Welcome";

interface ComponentProps {
}

let App: React.FC<ComponentProps> = () => {
    const [showWelcomePage] = useState(() => {
        const { apiKey, endpoint } = settingsStore.settings.movieSearchEngine
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
        <CssBaseline />
        <div className="select-none">
            <ErrorBoundary>
                <HashRouter>
                    <ElectronEvents />
                    <Overlay />
                    {
                        showWelcomePage ? <WelcomePage /> :
                            <Switch>
                                <Route path="/" exact>
                                    <HomePage />
                                </Route>
                                <Route path={pageURLS.SEARCH}>
                                    <WithBackButton>
                                        <Search />
                                    </WithBackButton>
                                </Route>
                                <Route path={pageURLS.FILM}>
                                    <WithBackButton>
                                        <FilmPage />
                                    </WithBackButton>
                                </Route>
                                <Route path="*">
                                    <CenterContent>
                                        <Typography variant="h3" arial->404</Typography>

                                        <Button component={RouterLink} to="/">GO HOME</Button>
                                    </CenterContent>
                                </Route>
                                {/* <Redirect from="/" /> */}
                            </Switch>
                    }
                </HashRouter>
            </ErrorBoundary>
        </div>
    </ThemeProvider>
}

export default App
