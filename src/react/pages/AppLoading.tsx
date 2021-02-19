import React, { useCallback, useEffect, useMemo, useState } from "react";

import { IpcRendererEvents, typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import {
    Button,
    CircularProgress,
    createMuiTheme,
    Grid,
    Link,
    makeStyles,
    MenuItem,
    TextField,
    ThemeProvider,
    Typography
} from "@material-ui/core";

import { appFirstLaunchVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";

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

const DialogGridItem: React.FC<{ part: 1 | 2; }> = ({ part, children }) =>
    <Grid item xs={part === 1 ? 5 : 7}>
        <Typography variant="h5">{children}</Typography>
    </Grid>;

type SetupState = {
    state: "loading";
} | {
    state: "loaded",
    specs: IpcRendererEvents["firstRunSpecs"];
};

const FirstLaunchDialog: React.FC = () => {
    const classes = useFirstLaunchStyles();

    const [state, setState] = useState<SetupState>({ state: "loading" });
    const [selectedPlayer, setSelectedPlayer] = useState(0);

    useEffect(() => {
        typedIpcRenderer.addEventListener("firstRunSpecs", (_event, specs) => {
            setState({ state: "loaded", specs });
        });

        return () => {
            typedIpcRenderer.removeAllListeners("firstRunSpecs");
        };
    }, []);

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

    const completeCallback = useCallback(() => {

        appFirstLaunchVar(false);
    }, []);

    const noPlayersInstalled = state.state === "loaded" && !state.specs.installedPlayers;
    const readyToGo = state.state === "loaded" &&
        state.specs.installedAceStreamVersion &&
        !noPlayersInstalled;

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
                                Ace Stream
                            </DialogGridItem>
                            <DialogGridItem part={2}>
                                <CircularProgress size={20} />
                            </DialogGridItem>

                            <DialogGridItem part={1}>
                                Default Player
                            </DialogGridItem>
                            <DialogGridItem part={2}>
                                {/* <CircularProgress size={20} /> */}
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
                            </DialogGridItem>
                        </Grid>
                    </Grid>
                    <Button variant="contained" onClick={completeCallback} color="primary" size="large" disabled={!readyToGo}>Complete</Button>
                </Grid>
            </div>
        </CenterContent>;
    </ThemeProvider>;
};

let AppLoadingPage: React.FC<ComponentProps> = () => {
    const appFirstLaunch = useReactiveVar(appFirstLaunchVar);

    return appFirstLaunch ? <FirstLaunchDialog /> : null;
};

export default AppLoadingPage;
