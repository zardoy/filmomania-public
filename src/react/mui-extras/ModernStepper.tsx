import React, { useState } from "react";

import { Step, StepButton, Stepper } from "@mui/material";

// in case of stable release, add render() function

export type StepComponent = React.FC<{ onStepCompleted: () => void }>

type ComponentProps = {
    children?: undefined
} & {
    steps: {
        title: string
        isComplete: boolean
        component: StepComponent
    }[]
    completedComponent: JSX.Element
}

let ModernStepper: React.FC<ComponentProps> = ({ steps, completedComponent }) => {
    const [completedSteps, setCompletedSteps] = React.useState(new Set<number>())

    const getIncompleteStepIndex = () => steps.findIndex((step, index) => !completedSteps.has(index) && step.isComplete === false)

    const [activeStep, setActiveStep] = useState(() => getIncompleteStepIndex())

    const onStepCompleted = () => {
        setCompletedSteps(steps => steps.add(activeStep))
        setActiveStep(getIncompleteStepIndex())
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const StepComponent = steps[activeStep]?.component!

    return <><Stepper alternativeLabel {...{ activeStep }}>
        {
            steps.map(({ title, isComplete }, index) => {
                return <Step completed={isComplete} key={title}>
                    <StepButton onClick={() => setActiveStep(index)}>
                        {title}
                    </StepButton>
                </Step>
            })
        }
    </Stepper>
    {
        activeStep === -1 ? completedComponent : <StepComponent {...{ onStepCompleted }} />
    }
    </>
}

export default ModernStepper
