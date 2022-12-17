import React, { useEffect, useState } from "react";

import normalizeUrl from "normalize-url";

import { Button, FormControl, FormLabel, RadioGroup, TextField, Typography } from "@mui/material";
import { useSimpleFormik } from "@zardoy/simple-formik";

import { settingsStore } from "../../electron-shared/settings";
import { StepComponent } from "../../mui-extras/ModernStepper";
import { typedIpcRenderer } from "typed-ipc";

export const SearchEngineStep: StepComponent = ({ onStepCompleted }) => {
    const { handleInput, values, handleForm, handleButton } = useSimpleFormik({
        initialValues: {
            endpoint: import.meta.env.VITE_SEARCH_ENGINE_ENDPOINT || "",
            apiKey: import.meta.env.VITE_SEARCH_ENGINE_API_KEY || ""
        },
        onSubmit(values) {
            Object.entries(values).forEach(([key, value]) => {
                settingsStore.set("movieSearchEngine", key, value)
            })
            onStepCompleted()
        },
        allRequired: true
    })

    const [endpoint] = useState(() => new URL(normalizeUrl(values.endpoint)).toString())

    return <form {...handleForm}>
        <div className="pt-2" />
        <div className="grid grid-cols-2">
            {
                // eslint-disable-next-line no-extra-parens
                ([
                    ["Provider", <Typography key={2} className="flex items-center select-text">{endpoint}</Typography>],
                    ["Provider API Key", <TextField key={2} size="small" required {...handleInput("apiKey")} />]
                ] as [string, JSX.Element][]).map(([label, component]) => {
                    return <React.Fragment key={label}>
                        <Typography className="flex items-center">{label}</Typography>

                        {component}
                    </React.Fragment>
                })
            }
        </div>
        <Button {...handleButton} className="float-right mt-2">Next step</Button>
    </form>
}

export const PlayerStep: StepComponent = () => {
    return null
}

export const ProxyStep: StepComponent = () => {
    useEffect(() => {
        console.log(typeof settingsStore.settings.internal.activeProxies)
    }, []);

    return <div className="flex justify-center">
        <FormControl>
            <Typography variant="h3">Proxy setup</Typography>
            <Button size="large" onClick={() => typedIpcRenderer.send("retryProxySetup")}>DO SETUP</Button>
        </FormControl>
    </div>
}
