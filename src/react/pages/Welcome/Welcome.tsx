import React, { useState } from "react";

import clsx from "clsx";

import { css } from "@emotion/css";
import { Grow, Step, StepButton, StepLabel, Stepper, Typography } from "@material-ui/core";

import { settingsStore } from "../../electron-shared/settings";
import ModernStepper from "../../mui-extras/ModernStepper";
import { PlayerStep, SearchEngineStep } from "./Steps";

interface ComponentProps {
}

const WeclomePage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0)

    return <Grow in>
        <div
            className="fixed inset-0 flex justify-center items-center flex-col backdrop-blur-sm z-[1250]"
        >
            <div className="flex flex-col items-center justify-end">
                <Typography variant="h1">Filmomania</Typography>
                <Typography variant="h5" gutterBottom>Initial setup</Typography>
            </div>
            <div
                className={clsx("bg-gray-800 rounded-lg p-5", css`
                    width: 800px;
                    height: 500px;
                `)}
            >
                <Stepper alternativeLabel activeStep={activeStep}>
                    <Step>
                        <StepButton onClick={() => setActiveStep(0)}>Search Engine</StepButton>
                    </Step>
                    <Step>
                        <StepLabel>Player</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Proxy</StepLabel>
                    </Step>
                </Stepper>
                <ModernStepper
                    steps={[
                        {
                            title: "Search engine",
                            isComplete:
                                !settingsStore.settings.movieSearchEngine.endpoint ||
                                !settingsStore.settings.movieSearchEngine.apiKey,
                            component: SearchEngineStep
                        },
                        {
                            title: "Player",
                            isComplete: true,
                            component: PlayerStep
                        },
                        {
                            title: "Proxy",
                            isComplete: false,
                            component: PlayerStep
                        },
                    ]}
                    completedComponent={<p>Setup finished</p>}
                />
            </div>
        </div>
    </Grow>
}

export default WeclomePage
