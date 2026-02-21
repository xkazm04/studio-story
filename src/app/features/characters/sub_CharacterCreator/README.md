# Character Creator Module

## Overview
Modular character appearance creation system with AI-powered image extraction and stepped form navigation.

## Features
- **Stepped Form**: Focus on each form section separately with stepper navigation
- **Image Upload**: Upload character portraits with automatic compression
- **AI Extraction**: Extract appearance details using Gemini/Groq vision models
- **Manual Input**: Traditional form-based input for all appearance fields
- **Live Preview**: Real-time generated description from appearance data
- **Randomizer**: AI-powered random character generation
- **Modular Design**: Each component is independent and reusable

## File Structure

```
sub_CharacterCreator/
├── CharacterAppearanceForm.tsx         # Main form (all sections visible)
├── CharacterAppearanceWithArchetypes.tsx # Form with archetype library + stepper
├── index.ts                            # Module exports
├── types.ts                            # TypeScript types
├── README.md                           # This file
│
├── components/                         # UI Components
│   ├── index.ts                        # Component exports
│   ├── FormStepper.tsx                 # Step navigation component
│   ├── SteppedAppearanceForm.tsx       # Stepped form version
│   ├── FormSection.tsx                 # Collapsible form section
│   ├── FormField.tsx                   # Form field renderer
│   ├── FormSubComponents.tsx           # Reusable form sub-components
│   ├── GenderSelector.tsx              # Gender selection widget
│   ├── PromptGenerator.tsx             # Section prompt generator
│   ├── CharacterImageUpload.tsx        # Image upload with drag & drop
│   ├── CharacterImageExtraction.tsx    # AI extraction workflow
│   ├── ImageGenerationPreview.tsx      # Image generation preview slots
│   └── AppearancePreview.tsx           # Generated description preview
│
└── lib/                                # Library functions
    ├── index.ts                        # Library exports
    ├── formConfig.ts                   # Form field configuration
    ├── promptGenerators.ts             # Prompt generation functions
    ├── randomizer.ts                   # AI character randomizer
    └── useAppearanceForm.ts            # Form state management hook
```

## Components

### Main Forms
- **CharacterAppearanceForm**: Non-stepped version showing all sections at once
- **CharacterAppearanceWithArchetypes**: Stepped form with archetype library integration

### Form Navigation
- **FormStepper**: Step indicators and navigation buttons
- **SteppedAppearanceForm**: Multi-step form with animated transitions

### Form Sections
Form is divided into 4 sections:
1. **Basic Attributes**: Gender, age, skin, body type, height
2. **Facial Features**: Face shape, eyes, hair, facial hair
3. **Clothing & Style**: Clothing style, colors, accessories
4. **Additional Details**: Custom distinctive features

### AI Features
- **CharacterImageExtraction**: Upload image and extract appearance with AI
- **Randomizer**: Generate random character using Ollama LLM

## Usage

### Stepped Form (Recommended)
```typescript
import { CharacterAppearanceWithArchetypes } from './sub_CharacterCreator';

<CharacterAppearanceWithArchetypes
  characterId={characterId}
  onArchetypeApplied={(archetype) => console.log('Applied:', archetype)}
/>
```

### Non-Stepped Form
```typescript
import { CharacterAppearanceForm } from './sub_CharacterCreator';

<CharacterAppearanceForm characterId={characterId} />
```

### Standalone Components
```typescript
import {
  FormStepper,
  CharacterImageExtraction,
  GenderSelector
} from './sub_CharacterCreator';

// Use individual components as needed
```

## Library Functions

### Form Configuration
```typescript
import { appearanceFormConfig, getFieldValue, setFieldValue } from './sub_CharacterCreator';

// Get form sections configuration
const sections = appearanceFormConfig;

// Get nested field value
const eyeColor = getFieldValue(appearance, 'face.eyeColor');

// Set nested field value
const updated = setFieldValue(appearance, 'face.eyeColor', 'blue');
```

### Prompt Generation
```typescript
import { generateFullPrompt, generateFacialFeaturesPrompt } from './sub_CharacterCreator';

const prompt = generateFullPrompt(appearance);
const facialPrompt = generateFacialFeaturesPrompt(appearance);
```

### Form State Hook
```typescript
import { useAppearanceForm } from './sub_CharacterCreator';

const {
  appearance,
  prompt,
  isLoading,
  handleChange,
  handleSave,
  handleRandomize,
} = useAppearanceForm({ characterId });
```

## API Endpoints Required

### /api/image-extraction/gemini
```typescript
POST /api/image-extraction/gemini
Body: { image: string (base64), prompt: string, schema: ExtractionSchema }
Response: { data: any, confidence: number }
```

### /api/image-extraction/groq
```typescript
POST /api/image-extraction/groq
Body: { image: string (base64), prompt: string, schema: ExtractionSchema }
Response: { data: any, confidence: number }
```

### /api/llm (for randomizer)
```typescript
POST /api/llm
Body: { prompt: string, systemPrompt: string, temperature: number }
Response: { content: string }
```

## Benefits

1. **Modular**: Each component under 200 lines for maintainability
2. **Focused Editing**: Stepper allows focus on one section at a time
3. **Type-Safe**: Full TypeScript support with strict typing
4. **Reusable**: Components can be used independently
5. **AI-Powered**: Image extraction and randomization features
6. **Accessible**: Keyboard navigation and proper ARIA labels
