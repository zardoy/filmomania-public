import React, { useCallback, useEffect, useMemo, useState } from "react";

import prettyFilesize from "filesize";
import { typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import {
    Button,
    CircularProgress,
    createMuiTheme,
    Grid,
    makeStyles,
    TextField,
    ThemeProvider,
    Typography
} from "@material-ui/core";

import { appInitialSetupStatusVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";
import LinearProgressWithLabel from "../mui-extras/LinearProgressWithLabel";

interface ComponentProps {
}

const useFirstLaunchStyles = makeStyles(theme => ({
    root: {
        backgroundColor: "black"
    },
    dialog: {
        width: 600,
        height: 600,
        backgroundColor: "rgb(28, 28, 28)",
        padding: theme.spacing(5),
        borderRadius: 25
    },
    bottomMargin: {
        marginBottom: theme.spacing(4)
    }
}));

// todo-high set body bg

const DialogGridItem: React.FC<{ part: 1 | 2, isText?: boolean; }> = ({ part, children, isText = true }) =>
    <Grid item xs={part === 1 ? 5 : 7} {...(isText ? {} : { container: true, alignItems: "center" })}>
        {isText ? <Typography variant="h5">{children}</Typography> : children}
    </Grid>;


interface InsatllAceStreamButtonProps {
    completeCallback?: any;
}

type InstallState = {
    state: "downloadNeeded";
} | {
    state: "downloading",
    progress: number; //0-1
    downloadedBytes: number;
} | {
    state: "installing";
};

const InsatllSodaPlayerButton: React.FC<InsatllAceStreamButtonProps> = () => {
    const [installState, setInstallState] = useState<InstallState>({
        state: "downloadNeeded",
    });

    useEffect(() => {
        typedIpcRenderer.addEventListener("updateSodaPlayerInstallationState", (_event, state) => {
            if (state.stage === "downloading") {
                setInstallState({
                    state: state.stage,
                    ...state
                });
            } else if (state.stage === "installing") {
                setInstallState({
                    state: state.stage
                });
            } else {
                appInitialSetupStatusVar({
                    status: "setupNeeded",
                    specs: {
                        sodaPlayerInstalled: true
                    }
                });
            }
        });

        return () => {
            typedIpcRenderer.removeAllListeners("updateSodaPlayerInstallationState");
        };
    });

    const installButtonClickHandler = useCallback(() => {
        typedIpcRenderer.send("installSodaPlayer");
    }, []);

    return installState.state === "downloadNeeded" ?
        <Button onClick={installButtonClickHandler} disabled={process.platform === "darwin"}>Install SodaPlayer</Button> :
        installState.state === "downloading" ?
            <LinearProgressWithLabel
                variant="determinate"
                value={installState.progress * 100}
                label={prettyFilesize(installState.downloadedBytes, { round: 0 })}
            /> :
            installState.state === "installing" ?
                <LinearProgressWithLabel label="Installing..." /> : null;
};

const getUrlEndpointBase = () => {
    let apiEndpoint = process.env.REACT_APP_SEARCH_ENGINE_ENDPOINT || "";
    if (!apiEndpoint.startsWith("http")) apiEndpoint = `https://${apiEndpoint}`;
    return new URL(apiEndpoint).host;
};

const WelcomePage: React.FC = () => {
    const classes = useFirstLaunchStyles();

    const appInitialSetupStatus = useReactiveVar(appInitialSetupStatusVar);

    const nestedTheme = useMemo(
        () => createMuiTheme({
            palette: {
                type: "dark"
            },
            props: {
                MuiTypography: {
                    color: "textPrimary"
                }
            }
        }),
        []
    );
    const [searchApiKey, setSearchApiKey] = useState(process.env.REACT_APP_SEARCH_ENGINE_API_KEY || "");
    const [searchApiEndpoint] = useState(process.env.REACT_APP_SEARCH_ENGINE_ENDPOINT || "");

    const completeCallback = useCallback(() => {
        typedIpcRenderer.send("setSetting", {
            scope: "searchEngine",
            name: "apiEndpoint",
            newValue: searchApiEndpoint
        });

        typedIpcRenderer.send("setSetting", {
            scope: "searchEngine",
            name: "apiKey",
            newValue: searchApiKey
        });

        appInitialSetupStatusVar({
            status: "appReady"
        });
    }, [searchApiKey]);

    const specs = "specs" in appInitialSetupStatus ? appInitialSetupStatus.specs : null;

    // todo-high MAKE SELECTABLE!!!

    // const noPlayersInstalled = state.state === "loaded" && !state.specs.installedPlayers;
    const readyToGo = (process.platform == "win32" ? specs?.sodaPlayerInstalled : true) &&
        searchApiKey && searchApiEndpoint;

    return <ThemeProvider theme={nestedTheme}>
        <CenterContent GridProps={{ className: classes.root }}>
            <div className={classes.dialog}>
                <Grid container direction="column" justify="space-between" style={{ height: "100%" }}>
                    <Grid item>
                        {/* todo use app name */}
                        <Typography className={classes.bottomMargin} variant="h3" align="center">Welcome to FilmoMania</Typography>
                        {/* FEATURES HERE */}
                        <Typography className={classes.bottomMargin} color="textSecondary">Setup these things to use FilmoMania</Typography>
                        <Grid item container>
                            <DialogGridItem part={1}>
                                Soda Player
                            </DialogGridItem>
                            <DialogGridItem part={2} isText={false}>
                                {!specs ? <CircularProgress size={20} /> :
                                    specs.sodaPlayerInstalled ? <Typography color="textSecondary">Installed</Typography> :
                                        <InsatllSodaPlayerButton />
                                }
                            </DialogGridItem>

                            {/* <DialogGridItem part={1}>
                                Default Player
                            </DialogGridItem>
                            <DialogGridItem part={2}>
                                <TextField
                                    select
                                    value={selectedPlayer}
                                    onChange={e => setSelectedPlayer(+e.target.value)}
                                >
                                    <MenuItem value={0}>VLC (default)</MenuItem>
                                    <MenuItem value={1}>VLC</MenuItem>
                                </TextField>
                                {
                                    !noPlayersInstalled &&
                                    <Typography color="error">Install <Link href="https://codecguide.com/download_k-lite_codec_pack_standard.htm">mpc-hc</Link> at least</Typography>
                                }
                            </DialogGridItem> */}
                            <DialogGridItem part={1}>Search Engine</DialogGridItem>
                            <DialogGridItem part={2}></DialogGridItem>

                            <DialogGridItem part={1}>Provider</DialogGridItem>
                            <DialogGridItem part={2}>{getUrlEndpointBase()}</DialogGridItem>
                            <DialogGridItem part={1}>API Key</DialogGridItem>
                            <DialogGridItem part={2}>
                                <TextField
                                    variant="filled"
                                    style={{ width: "100%" }}
                                    placeholder="Log endpoint"
                                    helperText="It's better to use your key, but default enough to testing"
                                    value={searchApiKey}
                                    onChange={e => setSearchApiKey(e.target.value)}
                                />
                            </DialogGridItem>
                        </Grid>
                    </Grid>
                    <Button variant="contained" onClick={completeCallback} color="primary" size="large" disabled={!readyToGo}>Complete</Button>
                </Grid>
            </div>
        </CenterContent>;
    </ThemeProvider>;
};

export default WelcomePage;
