import React, { useMemo } from "react";

import { HashRouter, Link as RouterLink, Route, Switch } from "react-router-dom";

import { useReactiveVar } from "@apollo/client";
import { Button, createMuiTheme, CssBaseline, ThemeProvider, Typography, useMediaQuery } from "@material-ui/core";
import { blue, lightBlue } from "@material-ui/core/colors";

import { appInitialSetupStatusVar, proxySetupStateVar } from "./apolloLocalState";
import CenterContent from "./components/CenterContent";
import ElectronEvents from "./components/ElectronEvents";
import ErrorBoundary from "./components/ErrorBoundary";
import OSD from "./components/OSD";
import WithBackButton from "./components/WithBackButton";
import { pageURLS } from "./electron-shared/URLS";
import HomePage from "./pages/Home";
import FilmPage from "./pages/Movie";
import ProxySetupPage from "./pages/ProxySetup";
import Search from "./pages/Search";
import WelcomePage from "./pages/Welcome";

interface ComponentProps {
}

let App: React.FC<ComponentProps> = () => {
    const { status: appStatus } = useReactiveVar(appInitialSetupStatusVar);
    const proxyNeededSetup = useReactiveVar(proxySetupStateVar).state !== "success";

    // MATERIAL-UI THEME
    const isDarkTheme = useMediaQuery(`(prefers-color-scheme: dark)`);
    const muiTheme = useMemo(
        () => createMuiTheme({
            palette: {
                // type: isDarkTheme ? "dark" : "light",
                type: "dark",
                primary: lightBlue,
                secondary: blue
            }
        }),
        [isDarkTheme]
    );

    return <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ErrorBoundary>
            <div>
                <HashRouter>
                    <ElectronEvents />
                    <OSD />
                    {
                        appStatus === "pending" ? null :
                            appStatus === "setupNeeded" ? <WelcomePage /> :
                                proxyNeededSetup ? <ProxySetupPage /> :
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
                                                <Typography variant="h3">404</Typography>
                                                <Button component={RouterLink} to="/">GO HOME</Button>
                                            </CenterContent>
                                        </Route>
                                        {/* <Redirect from="/" /> */}
                                    </Switch>
                    }
                </HashRouter>
            </div>
        </ErrorBoundary>
    </ThemeProvider>;
};

export default App;
