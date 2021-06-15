import React, { useCallback, useEffect, useState } from "react";

import prettyFilesize from "filesize";
import { IpcRendererEvents, typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Link,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    makeStyles,
    Step,
    StepButton,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from "@material-ui/core";
import { ExpandMore as ExpandMoreIcon } from "@material-ui/icons";

import { appInitialSetupStatusVar } from "../apolloLocalState";
import { settingsStore } from "../electron-shared/settings";
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
        {isText ? <Typography variant={part === 1 ? "h5" : "body1"}>{children}</Typography> : children}
    </Grid>;


interface InsatllAceStreamButtonProps {
    completeCallback?: any;
}

type InstallState = { stage: "initial"; } | Exclude<IpcRendererEvents["updateSodaPlayerInstallationState"], { stage: "done"; }>;

const SodaPlayerStatus: React.FC<InsatllAceStreamButtonProps> = () => {
    const initialSetupStatus = useReactiveVar(appInitialSetupStatusVar);

    const [installState, setInstallState] = useState<InstallState>({
        stage: "initial"
    });

    useEffect(() => {
        typedIpcRenderer.addEventListener("updateSodaPlayerInstallationState", (_event, state) => {
            if (state.stage === "done") {
                if (!state.patched) {
                    alert(`Patching temporarily unavailable as it has some critical issues :(`);
                }
                setInstallState({ stage: "initial" });
                const prevStatus = { ...appInitialSetupStatusVar() };
                if (prevStatus.status !== "setupNeeded") return;
                appInitialSetupStatusVar({
                    status: "setupNeeded",
                    specs: {
                        ...prevStatus.specs,
                        sodaPlayer: {
                            installed: true,
                            patched: state.patched
                        }
                    }
                });
                return;
            }
            setInstallState(state);
        });

        return () => {
            typedIpcRenderer.removeAllListeners("updateSodaPlayerInstallationState");
        };
    });

    const installAndPatchHandle = useCallback(() => {
        typedIpcRenderer.send("installOrAndPatchSodaPlayer");
    }, []);

    if (initialSetupStatus.status !== "setupNeeded") return null;

    const { installed, patched } = initialSetupStatus.specs.sodaPlayer;

    // todo nice green checkbox
    if (installed && patched) {
        return <Typography>Installed and Patched</Typography>;
    }
    if (installState.stage === "initial") {
        return <Button
            variant="contained"
            onClick={installAndPatchHandle}
            disabled={process.platform === "darwin"}
        >{`${!installed ? "Install and " : ""}Patch`}</Button>;
    } else if (installState.stage === "downloading") {
        // todo disable animation
        return <LinearProgressWithLabel
            variant="determinate"
            value={installState.progress * 100}
            label={prettyFilesize(installState.downloadedBytes, { round: 0 })}
        />;
    } else {
        return <LinearProgressWithLabel
            variant="indeterminate"
            label={installState.stage === "installing" ? "Installing..." : "Patching..."}
        />;
    }
};

const getUrlEndpointBase = () => {
    let apiEndpoint = import.meta.env.VITE_SEARCH_ENGINE_ENDPOINT || "";
    if (!apiEndpoint.startsWith("http")) apiEndpoint = `https://${apiEndpoint}`;
    return new URL(apiEndpoint).host;
};

interface StepProps {
    setStep: (newStep: number) => unknown;
}

const SearchEngineStep: React.FC<StepProps> = ({ setStep }) => {
    const [searchApiEndpoint] = useState(() =>
        settingsStore.get("searchEngineApiEndpoint") || import.meta.env.VITE_SEARCH_ENGINE_ENDPOINT || "");
    const [searchApiKey, setSearchApiKey] = useState(() =>
        settingsStore.get("searchEngineApiKey") || import.meta.env.VITE_SEARCH_ENGINE_API_KEY || "");

    const nextStepCallback = useCallback(() => {
        settingsStore.set("searchEngineApiEndpoint", searchApiEndpoint);
        settingsStore.set("searchEngineApiKey", searchApiKey);
        setStep(1);
    }, []);

    return <>
        <Grid item>
            <List>
                <ListItem divider>
                    <ListItemText primary="Provider" />
                    <ListItemSecondaryAction style={{ userSelect: "text" }}>{getUrlEndpointBase()}</ListItemSecondaryAction>
                </ListItem>
                <ListItem divider>
                    <ListItemText primary="API Key" />
                    <ListItemSecondaryAction>
                        <TextField
                            variant="filled"
                            size="small"
                            placeholder="Log endpoint"
                            helperText="It's better to use your key, but default enough for testing"
                            value={searchApiKey}
                            onChange={e => setSearchApiKey(e.target.value)}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
        </Grid>
        <Grid item container justify="flex-end" style={{ marginTop: 50 }}>
            <Button
                variant="contained"
                size="large"
                color="primary"
                disabled={
                    !searchApiKey || !searchApiEndpoint
                }
                onClick={nextStepCallback}
            >Next Step</Button>
        </Grid>
    </>;
};

const SodaPlayerStep: React.FC = () => {
    const setupStatus = useReactiveVar(appInitialSetupStatusVar);
    const finishSetupCallback = useCallback(() => {
        if (setupStatus.status !== "setupNeeded") return;
        settingsStore.set("generalDefaultPlayer", setupStatus.specs.sodaPlayer.patched ? "sodaPlayerPatched" : "sodaPlayer");
        appInitialSetupStatusVar({
            status: "appReady"
        });
    }, [setupStatus]);
    if (setupStatus.status !== "setupNeeded") return null;

    const canFinishSetup = setupStatus.specs.sodaPlayer.installed;

    return <>
        <Grid item>
            <Typography>FilmoMania works with Soda Player only, since its the best player in the world and we have patch to make it nicer!</Typography>
            <List>
                <ListItem divider>
                    <ListItemText primary="Soda Player" />
                    <ListItemSecondaryAction>
                        <SodaPlayerStatus />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
            <Typography variant="body2">
                Its <b>highly</b> recommend to apply the patch so FilmoMania could work properly.
            </Typography>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                >More Details About Patch</AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2">
                        {/* Feel free to skip this part if you want to keep player clean and simple.
                        But if you feel restricted or want some power in your hands here we go */}
                        Patch should not break existing features or effect the performance. It improves several sides of player and adds some features.
                        You can read more about patch here: <Link href="https://github.com/zardoy/soda-player-plus">Soda Player Plus</Link>
                        <br />I add the ability to disable certain features when I add more of them.
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Grid>
        <Grid item container justify="flex-end" style={{ marginTop: 50 }}>
            <Button
                variant="contained"
                onClick={finishSetupCallback}
                disabled={!canFinishSetup}
            >Finish Setup</Button>
        </Grid>
    </>;
};

const WelcomePage: React.FC = () => {
    const classes = useFirstLaunchStyles();

    // const nestedTheme = useMemo(
    //     () => createMuiTheme({
    //         palette: {
    //             type: "dark"
    //         },
    //         props: {
    //             MuiTypography: {
    //                 color: "textPrimary"
    //             }
    //         }
    //     }),
    //     []
    // );

    // todo-high MAKE SELECTABLE!!!

    // const noPlayersInstalled = state.state === "loaded" && !state.specs.installedPlayers;

    const [activeStep, setActiveStep] = useState(0);

    return <>
        {/* <CenterContent GridProps={{ className: classes.root }}> */}
        {/* <div className={classes.dialog}> */}
        {/* todo use app name */}
        <Dialog open={true} fullWidth>
            <DialogTitle>Initial Setup</DialogTitle>
            <DialogContent>
                {/* <Typography variant="h3" align="center">Welcome to FilmoMania</Typography> */}
                {/* review: features screen */}
                {/* <Typography className={classes.bottomMargin} color="textSecondary" align="center">Initial setup</Typography> */}
                {/* DIALOG CONTENT */}
                <Stepper activeStep={activeStep}>
                    <Step>
                        <StepButton onClick={() => setActiveStep(0)}>Search Engine</StepButton>
                    </Step>
                    <Step>
                        <StepLabel>Soda Player</StepLabel>
                    </Step>
                </Stepper>
                {/* TODO-VERY-HIGH use max height */}
                <Grid container direction="column" justify="space-between">
                    {
                        activeStep === 0 ? <SearchEngineStep setStep={setActiveStep} /> :
                            <SodaPlayerStep />
                    }
                </Grid>
            </DialogContent>
        </Dialog>
        {/* </div>
        </CenterContent>; */}
    </>;
};

export default WelcomePage;
