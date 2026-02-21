'use client';

import { Textarea } from "@/app/components/UI/Textarea";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    column?: string;
};

const StorySettingArea = ({ column }: Props) => {
    const [text, setText] = useState<string>('');

    const handleSettingChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
          <MapPin size={18} className="text-green-500" />
          <label htmlFor="setting" className="text-sm font-medium text-gray-100">
            Setting
          </label>
        </div>
        <Textarea
          value={text}
          onChange={handleSettingChange}
          placeholder="Describe where your story takes place..."
          size="md"
        />
      </div>
    );
}

export default StorySettingArea;
