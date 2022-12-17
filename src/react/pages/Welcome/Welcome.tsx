import React, { useEffect, } from "react";

import clsx from "clsx";

import { css } from "@emotion/css";
import { Grow, Typography } from "@mui/material";

import { useSettings } from "../../electron-shared/settings";
import ModernStepper from "../../mui-extras/ModernStepper";
import { PlayerStep, SearchEngineStep } from "./Steps";

const useWelcomeCompleteSteps = () => {
    const settings = useSettings()

    return {
        movieSearch: !!settings.movieSearchEngine.endpoint &&
        !!settings.movieSearchEngine.apiKey,
        player: true,
    }
}

const WeclomePage: React.FC = () => {
    const welcomeCompleteSteps = useWelcomeCompleteSteps()

    useEffect(() => {
        document.documentElement.classList.add("dark")
        return () => {
            document.documentElement.classList.remove("dark")
        }
    }, []);

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
                <ModernStepper
                    steps={[
                        {
                            title: "Search engine",
                            isComplete:welcomeCompleteSteps.movieSearch,
                            component: SearchEngineStep
                        },
                        {
                            title: "Player",
                            isComplete: welcomeCompleteSteps.player,
                            component: PlayerStep
                        },
                        // {
                        //     title: "Proxy",
                        //     isComplete: false,
                        //     component: ProxyStep
                        // },
                    ]}
                    completedComponent={<p>Setup finished</p>}
                />
            </div>
        </div>
    </Grow>
}

export default WeclomePage
