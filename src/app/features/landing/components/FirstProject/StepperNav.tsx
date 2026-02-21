'use client';

import { motion } from "framer-motion";

type Props = {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    steps: { id: number; title: string }[];
    selections: {
        projectType: string | null;
        narrator: string | null;
        template: string | null;
        genre: string | null;
    };
    setShowGuide: (showGuide: boolean) => void;
    projectName: string;
    projectDescription: string;
    handleProjectCreate: () => void;
}

const StepperNav = ({ 
    currentStep, 
    setCurrentStep, 
    steps, 
    selections, 
    setShowGuide,
    projectName, 
    projectDescription, 
    handleProjectCreate
 }: Props) => {
    const isStepComplete = () => {
        if (currentStep === 1) return selections.projectType !== null;
        if (currentStep === 2) return selections.narrator !== null;
        if (currentStep === 3) return selections.template !== null;
        if (currentStep === 4) return projectName !== "" && projectDescription !== "";
        return false;
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            handleProjectCreate();
        }
    };

    const handleBack = () => {
        if (currentStep === 1) {
            setShowGuide(false);
        }
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

    return (
        <div className="flex justify-between fixed bottom-0 w-full max-w-[1200px] py-5">
            <button
                onClick={handleBack}
                className="px-6 py-2 rounded-lg font-medium transition-all bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
                Back
            </button>

            <div className="mx-6 grow relative">
                <div className="h-0.5 w-full bg-gray-700 rounded-full"></div>
                <motion.div
                    className="h-0.5 absolute top-0 left-0 rounded-full bg-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                <div className="flex justify-between mt-2 relative">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="cursor-pointer text-center"
                            onClick={() => {
                                if (step.id <= currentStep ||
                                    (step.id === currentStep + 1 && isStepComplete())) {
                                    setCurrentStep(step.id);
                                }
                            }}
                        >
                            <div
                                className={`h-2 w-2 rounded-full mx-auto mb-1 transition-all
                                    ${step.id <= currentStep
                                        ? 'bg-blue-500'
                                        : 'bg-gray-700'}`}
                            />
                            <span
                                className={`text-xs font-medium transition-all
                                    ${step.id === currentStep
                                        ? 'text-blue-400'
                                        : step.id < currentStep
                                            ? 'text-gray-400'
                                            : 'text-gray-600'}`}
                            >
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <button
                onClick={() => handleNext()}
                disabled={!isStepComplete()}
                className={`px-6 py-2 rounded-lg font-medium transition-all
                        ${isStepComplete()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                        : 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-400'}`}
            >
                {currentStep !== steps.length && "Next"}
                {currentStep === steps.length && "Finish"}
            </button>
        </div>
    );
}

export default StepperNav;


