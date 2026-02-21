'use client';

import { SectionWrapper } from '@/app/components/UI';
import { Eye } from 'lucide-react';
import { Appearance } from '@/app/types/Character';

interface AppearancePreviewProps {
  appearance: Appearance;
}

/**
 * Generated Description Preview
 * Shows a human-readable description generated from appearance fields
 */
export function AppearancePreview({ appearance }: AppearancePreviewProps) {
  const generateDescription = (): string => {
    const parts = [];

    if (appearance.gender) parts.push(appearance.gender);
    if (appearance.age) parts.push(appearance.age);
    if (appearance.skinColor) parts.push(`${appearance.skinColor} skin`);
    if (appearance.height) parts.push(`${appearance.height} height`);
    if (appearance.bodyType) parts.push(`${appearance.bodyType} build`);

    if (appearance.face.hairColor && appearance.face.hairStyle) {
      parts.push(`${appearance.face.hairColor} ${appearance.face.hairStyle} hair`);
    }
    if (appearance.face.eyeColor) parts.push(`${appearance.face.eyeColor} eyes`);
    if (appearance.face.facialHair) parts.push(appearance.face.facialHair);

    if (appearance.clothing.style) {
      parts.push(`wearing ${appearance.clothing.style}`);
      if (appearance.clothing.color) {
        parts.push(`in ${appearance.clothing.color}`);
      }
    }

    if (appearance.customFeatures) parts.push(appearance.customFeatures);

    return parts.length > 0
      ? parts.join(', ')
      : 'Fill in the fields above to generate a description...';
  };

  return (
    <SectionWrapper borderColor="pink" padding="md">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={18} className="text-gray-400" />
        <h4 className="font-semibold text-white">Generated Description</h4>
      </div>
      <p className="text-gray-300 italic">{generateDescription()}</p>
    </SectionWrapper>
  );
}
