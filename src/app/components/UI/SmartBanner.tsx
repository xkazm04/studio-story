'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X, Layers } from "lucide-react";
import ColoredBorder from "@/app/components/UI/ColoredBorder";
import { useBanner } from "./BannerContext";
import Image from "next/image";

// Placeholder image component for when no image is provided
const PlaceholderImage = () => {
  return (
    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-800">
      <Layers size={20} className="text-blue-500" />
    </div>
  );
};

const SmartBanner = () => {
    const { title, subtitle, options, isVisible, hideBanner, isExpanded, setIsExpanded } = useBanner();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isVisible) setIsExpanded(true);
    }, [isVisible, setIsExpanded]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            hideBanner();
            setIsExiting(false);
        }, 300);
    };

    if (!isVisible && !isExiting) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="box-wrapper w-full"
            >
                <ColoredBorder />

                <div className="p-1">
                    <div className="px-4 pt-3 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-blue-400">{title}</h3>
                        <div className="flex gap-2">
                            <motion.button
                                key="expand-button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </motion.button>
                            <motion.button
                                key="close-button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClose}
                                className="p-1 rounded-full bg-gray-700/50 hover:bg-red-500/70 transition-colors"
                            >
                                <X size={18} />
                            </motion.button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                key="options-container"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-2">
                                    <p className="text-gray-400 mb-4 text-sm">
                                        {subtitle}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {options.map((option, index) => (
                                            <motion.div
                                                id={`option-${index}`}
                                                className="flex flex-col border border-gray-700/50 bg-gray-800/30 rounded-lg p-4 transition-all hover:bg-gray-800/50"
                                                key={index}
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    {option.imageUrl ? (
                                                        <div className="shrink-0">
                                                            <Image
                                                                src={option.imageUrl}
                                                                alt={option.title}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-md object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="shrink-0">
                                                            <PlaceholderImage />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-medium text-sm mb-1">{option.title}</h3>
                                                        <p className="text-gray-400 text-xs">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto">
                                                    <motion.button
                                                        key={`option-button-${index}`}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={option.action}
                                                        className="text-white text-xs font-medium py-1.5 px-3 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-xs transition-all shadow-md w-full hover:from-blue-700 hover:to-blue-800"
                                                    >
                                                        {option.button}
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SmartBanner;


