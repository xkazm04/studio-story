'use client';

import { Select } from "@/app/components/UI/Select";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const audienceOptions = [
    { value: "children-5-8", label: "Children (5-8)" },
    { value: "middle-grade", label: "Middle Grade (9-12)" },
    { value: "young-adult", label: "Young Adult (13-18)" },
    { value: "new-adult", label: "New Adult (18-25)" },
    { value: "adult", label: "Adult (18+)" },
    { value: "family-friendly", label: "Family-Friendly" },
    { value: "general", label: "General" }
];

const timePeriodOptions = [
    { value: "ancient", label: "Ancient World" },
    { value: "medieval", label: "Medieval" },
    { value: "renaissance", label: "Renaissance" },
    { value: "industrial", label: "Industrial Revolution" },
    { value: "victorian", label: "Victorian Era" },
    { value: "early-20th", label: "Early 20th Century" },
    { value: "ww-era", label: "World War Era" },
    { value: "mid-20th", label: "Mid-20th Century" },
    { value: "modern", label: "Modern Day" },
    { value: "near-future", label: "Near Future" },
    { value: "distant-future", label: "Distant Future" },
    { value: "post-apocalyptic", label: "Post-Apocalyptic" },
    { value: "timeless", label: "Timeless" }
];

const genreOptions = [
    { value: "adventure", label: "Adventure" },
    { value: "fantasy", label: "Fantasy" },
    { value: "scifi", label: "Science Fiction" },
    { value: "mystery", label: "Mystery" },
    { value: "thriller", label: "Thriller" },
    { value: "romance", label: "Romance" },
    { value: "historical", label: "Historical Fiction" },
    { value: "horror", label: "Horror" },
    { value: "comedy", label: "Comedy" },
    { value: "drama", label: "Drama" },
    { value: "non-fiction", label: "Non-Fiction" },
    { value: "poetry", label: "Poetry" },
    { value: "graphic-novel", label: "Graphic Novel" },
    { value: "memoir", label: "Memoir" }
];

interface Props {
  type: string;
  column?: string;
}

interface SelectionConfig {
  id: number;
  type: string;
  label: string;
  options: { value: string; label: string }[];
}

const StoryConfigSelect = ({ type, column }: Props) => {
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [label, setLabel] = useState<string>('');
    const [editMode, setEditMode] = useState<boolean>(false);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        setSelectedOption(newValue);
        setEditMode(false);
        // TODO: Save to backend
    };

    const selectionsConfig: SelectionConfig[] = [
        {
            id: 1,
            type: 'audience',
            label: "Audience",
            options: audienceOptions
        },
        {
            id: 2,
            type: 'genre',
            label: "Genre",
            options: genreOptions
        },
        {
            id: 3,
            type: 'time',
            label: "Time Period",
            options: timePeriodOptions
        }
    ];

    // Initialize component with values
    useEffect(() => {
        const selectedConfig = selectionsConfig.find(config => config.type === type);
        if (selectedConfig) {
            setOptions(selectedConfig.options);
            setLabel(selectedConfig.label);

            if (column) {
                setSelectedOption(column);
            }
        }
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, column]);

    const displayLabel = selectedOption ?
        options.find(opt => opt.value === selectedOption)?.label || column || 'Not set'
        : column || 'Not set';

    return (
      <AnimatePresence>
        {!editMode ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between mb-2">
            <button
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              onClick={() => setEditMode(true)}
            >
              {displayLabel}
            </button>
          </motion.div>
        ) : (
          <Select
            label={label}
            options={options}
            value={selectedOption}
            onChange={handleChange}
            placeholder={`Select ${label.toLowerCase()}...`}
          />
        )}
      </AnimatePresence>
    );
}

export default StoryConfigSelect;
