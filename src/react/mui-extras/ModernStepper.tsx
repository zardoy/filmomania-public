import React, { useState } from "react";

import { Step, StepButton, Stepper } from "@mui/material";

export type StepComponent = React.FC<{ onStepCompleted: () => void }>

type ComponentProps = {
    children?: undefined
} & {
    steps: {
        title: string
        isComplete: boolean
        component: StepComponent
    }[]
    completedComponent?: JSX.Element
    onSetupFinish?: () => any
}

const ModernStepper: React.FC<ComponentProps> = ({ steps, completedComponent, onSetupFinish }) => {
    const [completedSteps, setCompletedSteps] = React.useState(new Set<number>())

    const getIncompleteStepIndex = () => steps.findIndex((step, index) => !completedSteps.has(index) && step.isComplete === false)

    const [activeStep, setActiveStep] = useState(() => getIncompleteStepIndex())

    const onStepCompleted = () => {
        setCompletedSteps(steps => steps.add(activeStep))
        const newStepIndex = getIncompleteStepIndex();
        setActiveStep(newStepIndex)
        if (newStepIndex === -1) onSetupFinish?.()
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
        activeStep !== -1 ? <StepComponent {...{ onStepCompleted }} /> : completedComponent ? completedComponent : null
    }
    </>
}

export default ModernStepper
