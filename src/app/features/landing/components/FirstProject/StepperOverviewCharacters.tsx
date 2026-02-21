import { characterTypes, getCharacterTypeColor } from "@/app/constants/characterEnums";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

type CharacterTypeButtonProps = {
    type: "protagonist" | "antagonist" | "neutral";
    currentType: string;
    label: string;
    onClick: () => void;
    className?: string;
};

const CharacterTypeButton = ({
    type,
    currentType,
    label,
    onClick,
    className = ""
}: CharacterTypeButtonProps) => {
    const isSelected = type === currentType;
    let colorScheme = "";
    switch (type) {
        case "protagonist":
            colorScheme = isSelected ? "bg-emerald-600/20 text-emerald-400" : "";
            break;
        case "antagonist":
            colorScheme = isSelected ? "bg-rose-600/20 text-rose-400" : "";
            break;
        case "neutral":
            colorScheme = isSelected ? "bg-amber-600/20 text-amber-400" : "";
            break;
    }

    return (
        <button
            onClick={onClick}
            className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${isSelected
                ? colorScheme
                : "text-gray-400 hover:bg-gray-700"
                } ${className}`}
        >
            {label}
        </button>
    );
};

type Props = {
    characters: { id: string; name: string; type: "protagonist" | "antagonist" | "neutral" }[];
    setCharacters: (characters: { id: string; name: string; type: "protagonist" | "antagonist" | "neutral" }[]) => void;
};

const StepperOverviewCharacters = ({ characters, setCharacters }: Props) => {

    useEffect(() => {
        const lastCharacter = characters[characters.length - 1];
        if (lastCharacter.name.trim() !== "" && characters.length < 3) {
            handleAddCharacter();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characters]);

    const handleAddCharacter = () => {
        if (characters.length < 3) {
            setCharacters([...characters, { id: `char-${Date.now()}`, name: "", type: "protagonist" }]);
        }
    };

    const handleRemoveCharacter = (id: string) => {
        setCharacters(characters.filter(char => char.id !== id));
    };

    const handleCharacterNameChange = (id: string, name: string) => {
        setCharacters(
            characters.map(char => (char.id === id ? { ...char, name } : char))
        );
    };

    const handleCharacterTypeChange = (id: string, type: "protagonist" | "antagonist" | "neutral") => {
        setCharacters(
            characters.map(char => (char.id === id ? { ...char, type } : char))
        );
    };

    return (
        <>
            <div className="mt-6 mb-3 flex justify-between items-center">
                <label className="block text-sm font-medium text-blue-300">
                    Story Characters
                </label>
                <div className="text-xs text-gray-400">
                    {characters.filter(c => c.name.trim()).length}/3 characters
                </div>
            </div>

            <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800 overflow-y-auto">
                <AnimatePresence>
                    {characters.map((character, index) => (
                        <motion.div
                            key={character.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mb-3 last:mb-0"
                        >
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="grow z-10">
                                    <input
                                        type="text"
                                        value={character.name}
                                        onChange={(e) => handleCharacterNameChange(character.id, e.target.value)}
                                        placeholder={index === characters.length - 1 ? "Add new character..." : "Character name"}
                                        className={`w-full p-2 z-10 rounded-lg bg-gray-800/50 border ${
                                            character.name ? 'border-green-700/40' : 'border-gray-700 border-opacity-30'
                                        } focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all duration-200`}
                                    />
                                </div>

                                <div className="flex items-center gap-2 mt-2 z-10 sm:mt-0">
                                    {/* Character Type Selector */}
                                    <div className="flex items-center rounded-md bg-gray-800/70 border border-gray-700 p-1">
                                        {characterTypes.map((typeConfig) => (
                                            <CharacterTypeButton
                                                key={typeConfig.type}
                                                type={typeConfig.type}
                                                currentType={character.type}
                                                label={typeConfig.label}
                                                onClick={() => handleCharacterTypeChange(character.id, typeConfig.type)}
                                            />
                                        ))}
                                    </div>

                                    {/* Remove Button */}
                                    {character.name && index !== characters.length - 1 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleRemoveCharacter(character.id)}
                                            className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                            aria-label="Remove character"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                            {/* Character Type Badge */}
                            {character.name && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 flex"
                                >
                                    <div className={`px-2 py-0.5 text-xs rounded-md border ${getCharacterTypeColor(character.type)}`}>
                                        {character.type === "protagonist" && "Protagonist"}
                                        {character.type === "antagonist" && "Antagonist"}
                                        {character.type === "neutral" && "Supporting Character"}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {characters.length === 3 && characters[2].name !== "" && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-amber-400 mt-2"
                    >
                        Maximum 3 characters reached
                    </motion.p>
                )}
            </div>
        </>
    );
}

export default StepperOverviewCharacters


