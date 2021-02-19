import React, { useEffect, useMemo, useState } from "react";

import { HashRouter, Link as RouterLink, Route } from "react-router-dom";
import { typedIpcRenderer } from "typed-ipc";

import {
    Button,
    createMuiTheme,
    CssBaseline,
    makeStyles,
    ThemeProvider,
    Typography,
    useMediaQuery
} from "@material-ui/core";
import { blue, lightBlue } from "@material-ui/core/colors";

import { appFirstLaunchVar, externalModulesStatusVar } from "./apolloLocalState";
import CenterContent from "./components/CenterContent";
import ElectronEvents from "./components/ElectronEvents";
import WithBackButton from "./components/WithBackButton";
import { pageURLS } from "./electron-shared/URLS";
import AppLoadingPage from "./pages/AppLoading";
import FilmPage from "./pages/Film";
import HomePage from "./pages/Home";
import Search from "./pages/Search";

interface ComponentProps {
}

const useStyles = makeStyles(() => ({
    content: {
        // padding: theme.spacing(4)
    }
}));

let App: React.FC<ComponentProps> = () => {
    const classes = useStyles();
    const [showApp, setShowApp] = useState(false);

    // MATERIAL-UI THEME
    const isDarkTheme = useMediaQuery(`(prefers-color-scheme: dark)`);
    const muiTheme = useMemo(
        () => createMuiTheme({
            palette: {
                // type: isDarkTheme ? "dark" : "light",
                type: "light",
                primary: lightBlue,
                secondary: blue
            }
        }),
        [isDarkTheme]
    );

    useEffect(() => {
        void (async () => {
            const { data: { isFirstLaunch } } = await typedIpcRenderer.request("appInit");
            appFirstLaunchVar(isFirstLaunch);
            setShowApp(!isFirstLaunch);
        })();

        // todo-low you know what to use
        typedIpcRenderer.addEventListener("updateConnectedModuleInfo", (_, newModuleInfo) => {
            const newState = {
                ...externalModulesStatusVar(),
                ...newModuleInfo
            };
            externalModulesStatusVar(newState);
        });

        return () => {
            typedIpcRenderer.removeAllListeners("updateConnectedModuleInfo");
        };
    }, []);

    return <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div className={classes.content}>
            <HashRouter>
                <ElectronEvents />
                {
                    !showApp ?
                        <AppLoadingPage /> :
                        <>
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
                            <Route path="/">
                                <CenterContent>
                                    <Typography variant="h3">404</Typography>
                                    <Button component={RouterLink} to="/">GO HOME</Button>
                                </CenterContent>
                            </Route>
                            {/* <Redirect from="/" /> */}
                        </>
                }
            </HashRouter>
        </div>
    </ThemeProvider>;
};

export default App;
