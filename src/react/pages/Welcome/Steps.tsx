import React, { useState } from "react";

import normalizeUrl from "normalize-url";

import { Button, FormControl, FormLabel, RadioGroup, TextField, Typography } from "@material-ui/core";
import { useSimpleFormik } from "@zardoy/simple-formik";

import { settingsStore } from "../../electron-shared/settings";
import { StepComponent } from "../../mui-extras/ModernStepper";

export const SearchEngineStep: StepComponent = ({ onStepCompleted }) => {
    const { handleInput, handleSubmit, values, submitButtonDisabled } = useSimpleFormik({
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

    const [endpoint] = useState(() => new URL(normalizeUrl(values.endpoint)))

    return <form onSubmit={handleSubmit}>
        <div className="pt-2" />
        <div className="grid grid-cols-2">
            {
                ([
                    ["Provider", <Typography className="flex items-center select-text">{endpoint}</Typography>],
                    ["Provider API Key", <TextField size="small" required {...handleInput("endpoint")} />]
                ] as [string, JSX.Element][]).map(([label, component]) => {
                    return <React.Fragment key={label}>
                        <Typography className="flex items-center">{label}</Typography>
                        {component}
                    </React.Fragment>
                })
            }
        </div>
        <Button disabled={submitButtonDisabled} type="submit">Next step</Button>
    </form>
}

export const PlayerStep: StepComponent = () => {
    return null
}

export const ProxyStep: StepComponent = () => {
    return <div>
        <FormControl>
            <FormLabel>Proxy type</FormLabel>
            <RadioGroup
                name="proxy-type-group"
            ></RadioGroup>
        </FormControl>
    </div>
}
