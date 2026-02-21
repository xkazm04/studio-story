import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

type Props = {
    objectives: { id: string; name: string }[];
    setObjectives: (objectives: { id: string; name: string }[]) => void;
}

const StepperOverviewObjectives = ({ objectives, setObjectives }: Props) => {
    
    useEffect(() => {
        const lastObjective = objectives[objectives.length - 1];
        if (lastObjective.name.trim() !== "" && objectives.length < 10) {
            handleAddObjective();
        }
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objectives]);

    const handleAddObjective = () => {
        if (objectives.length < 10) {
            setObjectives([...objectives, { id: `obj-${Date.now()}`, name: "" }]);
        }
    };

    const handleRemoveObjective = (id: string) => {
        setObjectives(objectives.filter(obj => obj.id !== id));
    };

    const handleObjectiveChange = (id: string, name: string) => {
        setObjectives(
            objectives.map(obj => (obj.id === id ? { ...obj, name } : obj))
        );
    };
    
    return (
        <>
            <div className="mb-3 flex justify-between items-center">
                <label className="block text-sm font-medium text-blue-300">
                    Project Objectives
                </label>
                <div className="text-xs text-gray-400">
                    {objectives.filter(o => o.name.trim()).length}/10 objectives
                </div>
            </div>

            <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800 grow overflow-y-auto max-h-[250px]">
                <AnimatePresence>
                    {objectives.map((objective, index) => (
                        <motion.div
                            key={objective.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mb-2 last:mb-0"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-300 shrink-0">
                                    <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                                <input
                                    type="text"
                                    value={objective.name}
                                    onChange={(e) => handleObjectiveChange(objective.id, e.target.value)}
                                    placeholder={index === objectives.length - 1 ? "Add new objective..." : "Enter objective..."}
                                    className={`grow p-2 z-10 rounded-lg bg-gray-800/50 border ${
                                        objective.name ? 'border-green-700/40' : 'border-gray-700 border-opacity-30'
                                    } focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all duration-200`}
                                />

                                {objective.name && index !== objectives.length - 1 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleRemoveObjective(objective.id)}
                                        className="p-1 rounded-full bg-red-500/20 z-10 hover:bg-red-500/30 text-red-400"
                                        aria-label="Remove objective"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {objectives.length === 10 && objectives[9].name !== "" && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-amber-400 mt-2"
                    >
                        Maximum 10 objectives reached
                    </motion.p>
                )}
            </div>
        </>
    );
}

export default StepperOverviewObjectives;


