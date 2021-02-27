import React, { useMemo } from "react";

import { HashRouter, Link as RouterLink, Route } from "react-router-dom";

import { useReactiveVar } from "@apollo/client";
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

import { appInitialSetupStatusVar, proxySetupStateVar } from "./apolloLocalState";
import CenterContent from "./components/CenterContent";
import ElectronEvents from "./components/ElectronEvents";
import WithBackButton from "./components/WithBackButton";
import { pageURLS } from "./electron-shared/URLS";
import HomePage from "./pages/Home";
import FilmPage from "./pages/Movie";
import ProxySetupPage from "./pages/ProxySetup";
import Search from "./pages/Search";
import WelcomePage from "./pages/Welcome";

interface ComponentProps {
}

const useStyles = makeStyles(() => ({
    content: {
        // padding: theme.spacing(4)
    }
}));

let App: React.FC<ComponentProps> = () => {
    const classes = useStyles();

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
        <div className={classes.content}>
            <HashRouter>
                <ElectronEvents />
                {
                    appStatus === "pending" ? null :
                        appStatus === "setupNeeded" ? <WelcomePage /> :
                            proxyNeededSetup ? <ProxySetupPage /> :
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
