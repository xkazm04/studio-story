export const characterTypes = [
    { type: "protagonist" as const, label: "Hero" },
    { type: "antagonist" as const, label: "Villain" },
    { type: "neutral" as const, label: "Support" }
];

export const getCharacterTypeColor = (type: "protagonist" | "antagonist" | "neutral") => {
    switch (type) {
        case "protagonist":
            return "border-emerald-500 bg-emerald-600/20 text-emerald-400";
        case "antagonist":
            return "border-rose-500 bg-rose-600/20 text-rose-400";
        case "neutral":
            return "border-amber-500 bg-amber-600/20 text-amber-400";
        default:
            return "border-gray-500 bg-gray-600/20 text-gray-400";
    }
};


