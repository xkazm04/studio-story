'use client';

import BackgroundPattern from "@/app/components/animation/BackgroundPattern";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type SelectionType = {
    projectType: string | null;
    narrator: string | null;
    template: string | null;
    genre: string | null;
};

type Props = {
    item: {
        id: string;
        title: string;
        description: string;
        image?: string;
        voiceId?: string;
    }
    currentStep: number;
    setSelections: (selections: SelectionType) => void;
    selections: SelectionType;
    genderPreference?: string;
};

const StepperItem = ({item, currentStep, setSelections, selections, genderPreference}: Props) => {
      const handleSelection = (itemId: string) => {
        if (currentStep === 1) {
          setSelections({ ...selections, projectType: itemId });
        } else if (currentStep === 2) {
          setSelections({ ...selections, narrator: itemId });
        } else if (currentStep === 3) {
          setSelections({ ...selections, template: itemId });
        }
      };
    
      const getCurrentSelection = () => {
        if (currentStep === 1) return selections.projectType;
        if (currentStep === 2) return selections.narrator;
        if (currentStep === 3) return selections.template;
        return null;
      };

    return <div
        key={item.id}
        title={item.title}
        onClick={() => handleSelection(item.id)}
        className={`rounded-xl overflow-hidden border-2 flex flex-col relative
                    transition-all duration-300 cursor-pointer hover:brightness-150
                    ${getCurrentSelection() === item.id
                ? 'border-blue-500 border-opacity-100 shadow-lg shadow-blue-500/50 brightness-150 animate-pulse'
                : 'border-gray-700 opacity-60 border-opacity-30'}`}
    >
        <div className="relative w-full" style={{ height: '80%' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <BackgroundPattern />
            <AnimatePresence mode="wait">
                <motion.div
                    key={item.image}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src={item.image || "/images/placeholder.jpg"}
                        alt={item.title}
                        fill
                        style={{ objectFit: "cover" }}
                        priority={getCurrentSelection() === item.id}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
        <div className="p-4 bg-gray-900 bg-opacity-90 flex flex-col justify-start z-20" style={{ height: '30%' }}>
            <h3 className={`text-xl font-semibold ${getCurrentSelection() === item.id ? 'text-blue-400' : 'text-white'}`}>
                {item.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-3">
                {item.description}
            </p>
        </div>
    </div>
}

export default StepperItem;


