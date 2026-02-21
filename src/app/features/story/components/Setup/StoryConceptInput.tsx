'use client';

import { Textarea } from "@/app/components/UI/Textarea";
import { LightbulbIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    column?: string;
}

const StoryConceptInput = ({ column }: Props) => {
    const [text, setText] = useState<string>('');

    const handleConceptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
        // TODO: Debounce and save to backend
    };

    useEffect(() => {
        if (column) {
            setText(column);
        }
    }, [column]);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LightbulbIcon size={18} className="text-yellow-500" />
          <label htmlFor="concept" className="text-sm font-medium text-gray-100">
            Concept
          </label>
        </div>
        <Textarea
          value={text}
          onChange={handleConceptChange}
          placeholder="Write a 1-2 sentence high-level concept of your story"
          size="md"
        />
      </div>
    );
}

export default StoryConceptInput;
