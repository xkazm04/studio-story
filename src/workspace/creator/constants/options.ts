/**
 * Options for each category - these populate the right sidebar palette
 * preview values are icon registry keys (rendered by CreatorIcon)
 */

import type { CategoryOption, CategoryId } from '../types';

export const CATEGORY_OPTIONS: Record<CategoryId, CategoryOption[]> = {
  hair: [
    { id: 1, name: 'Long Wavy', preview: 'hair-longWavy', promptValue: 'long wavy flowing' },
    { id: 2, name: 'Short Spiky', preview: 'hair-shortSpiky', promptValue: 'short spiky' },
    { id: 3, name: 'Braided Crown', preview: 'hair-braidedCrown', promptValue: 'intricately braided crown' },
    { id: 4, name: 'Undercut', preview: 'hair-undercut', promptValue: 'modern undercut' },
    { id: 5, name: 'Flowing Locks', preview: 'hair-flowingLocks', promptValue: 'majestic flowing' },
    { id: 6, name: 'Mohawk', preview: 'hair-mohawk', promptValue: 'bold mohawk' },
    { id: 7, name: 'Pixie Cut', preview: 'hair-pixieCut', promptValue: 'playful pixie cut' },
    { id: 8, name: 'Ponytail', preview: 'hair-ponytail', promptValue: 'practical ponytail' },
    { id: 9, name: 'Afro', preview: 'hair-afro', promptValue: 'voluminous afro' },
    { id: 10, name: 'Bald', preview: 'hair-bald', promptValue: 'clean bald' },
    { id: 11, name: 'Dreadlocks', preview: 'hair-dreadlocks', promptValue: 'long dreadlocks' },
    { id: 12, name: 'Side Shave', preview: 'hair-sideShave', promptValue: 'asymmetric side shave' },
  ],

  eyes: [
    { id: 1, name: 'Almond', preview: 'eyes-almond', promptValue: 'almond-shaped', description: 'Classic balanced' },
    { id: 2, name: 'Round', preview: 'eyes-round', promptValue: 'round wide', description: 'Youthful look' },
    { id: 3, name: 'Hooded', preview: 'eyes-hooded', promptValue: 'hooded mysterious', description: 'Intense' },
    { id: 4, name: 'Upturned', preview: 'eyes-upturned', promptValue: 'upturned cat-like', description: 'Exotic' },
    { id: 5, name: 'Downturned', preview: 'eyes-downturned', promptValue: 'downturned gentle', description: 'Melancholic' },
    { id: 6, name: 'Monolid', preview: 'eyes-monolid', promptValue: 'elegant monolid', description: 'Sleek' },
    { id: 7, name: 'Deep Set', preview: 'eyes-deepSet', promptValue: 'deep-set intense', description: 'Brooding' },
    { id: 8, name: 'Wide Set', preview: 'eyes-wideSet', promptValue: 'wide-set dreamy', description: 'Open' },
  ],

  nose: [
    { id: 1, name: 'Straight', preview: 'nose-straight', promptValue: 'straight' },
    { id: 2, name: 'Aquiline', preview: 'nose-aquiline', promptValue: 'aquiline noble' },
    { id: 3, name: 'Button', preview: 'nose-button', promptValue: 'small button' },
    { id: 4, name: 'Roman', preview: 'nose-roman', promptValue: 'strong Roman' },
    { id: 5, name: 'Snub', preview: 'nose-snub', promptValue: 'upturned snub' },
    { id: 6, name: 'Hawk', preview: 'nose-hawk', promptValue: 'prominent hawk' },
    { id: 7, name: 'Nubian', preview: 'nose-nubian', promptValue: 'wide Nubian' },
    { id: 8, name: 'Greek', preview: 'nose-greek', promptValue: 'classic Greek' },
  ],

  mouth: [
    { id: 1, name: 'Full Lips', preview: 'mouth-fullLips', promptValue: 'full plump' },
    { id: 2, name: 'Thin Lips', preview: 'mouth-thinLips', promptValue: 'thin refined' },
    { id: 3, name: 'Cupid Bow', preview: 'mouth-cupidBow', promptValue: 'defined cupid bow' },
    { id: 4, name: 'Wide Smile', preview: 'mouth-wideSmile', promptValue: 'wide expressive' },
    { id: 5, name: 'Heart Shape', preview: 'mouth-heartShape', promptValue: 'heart-shaped' },
    { id: 6, name: 'Downturned', preview: 'mouth-downturned', promptValue: 'slightly downturned' },
    { id: 7, name: 'Pouty', preview: 'mouth-pouty', promptValue: 'pouty full' },
    { id: 8, name: 'Smirk', preview: 'mouth-smirk', promptValue: 'asymmetric smirk' },
  ],

  expression: [
    { id: 1, name: 'Neutral', preview: 'expr-neutral', promptValue: 'neutral calm' },
    { id: 2, name: 'Smile', preview: 'expr-smile', promptValue: 'warm smiling' },
    { id: 3, name: 'Smirk', preview: 'expr-smirk', promptValue: 'confident smirk' },
    { id: 4, name: 'Fierce', preview: 'expr-fierce', promptValue: 'fierce determined' },
    { id: 5, name: 'Sad', preview: 'expr-sad', promptValue: 'melancholic sad' },
    { id: 6, name: 'Surprised', preview: 'expr-surprised', promptValue: 'surprised wide-eyed' },
    { id: 7, name: 'Determined', preview: 'expr-determined', promptValue: 'intensely determined' },
    { id: 8, name: 'Serene', preview: 'expr-serene', promptValue: 'peaceful serene' },
  ],

  makeup: [
    { id: 1, name: 'Natural', preview: 'makeup-natural', promptValue: 'natural minimal' },
    { id: 2, name: 'Smoky Eye', preview: 'makeup-smokyEye', promptValue: 'dramatic smoky eye' },
    { id: 3, name: 'Glam', preview: 'makeup-glam', promptValue: 'glamorous bold' },
    { id: 4, name: 'Gothic', preview: 'makeup-gothic', promptValue: 'dark gothic' },
    { id: 5, name: 'Tribal', preview: 'makeup-tribal', promptValue: 'tribal war paint' },
    { id: 6, name: 'Ethereal', preview: 'makeup-ethereal', promptValue: 'ethereal shimmering' },
    { id: 7, name: 'Warrior', preview: 'makeup-warrior', promptValue: 'battle-worn war paint' },
    { id: 8, name: 'Fantasy', preview: 'makeup-fantasy', promptValue: 'fantastical colorful' },
  ],

  markings: [
    { id: 1, name: 'None', preview: 'marking-none', promptValue: '' },
    { id: 2, name: 'Scar (Eye)', preview: 'marking-scarEye', promptValue: 'a scar across the eye' },
    { id: 3, name: 'Scar (Cheek)', preview: 'marking-scarCheek', promptValue: 'a scar on the cheek' },
    { id: 4, name: 'Tribal Tattoo', preview: 'marking-tribalTattoo', promptValue: 'tribal face tattoos' },
    { id: 5, name: 'Rune Tattoo', preview: 'marking-runeTattoo', promptValue: 'mystical rune tattoos' },
    { id: 6, name: 'Freckles', preview: 'marking-freckles', promptValue: 'natural freckles' },
    { id: 7, name: 'Beauty Mark', preview: 'marking-beautyMark', promptValue: 'a beauty mark' },
    { id: 8, name: 'War Paint', preview: 'marking-warPaint', promptValue: 'ceremonial war paint' },
    { id: 9, name: 'Birthmark', preview: 'marking-birthmark', promptValue: 'a distinctive birthmark' },
  ],

  accessories: [
    { id: 1, name: 'None', preview: 'acc-none', promptValue: '' },
    { id: 2, name: 'Glasses', preview: 'acc-glasses', promptValue: 'elegant glasses' },
    { id: 3, name: 'Monocle', preview: 'acc-monocle', promptValue: 'a monocle' },
    { id: 4, name: 'Eye Patch', preview: 'acc-eyePatch', promptValue: 'a leather eye patch' },
    { id: 5, name: 'Earrings', preview: 'acc-earrings', promptValue: 'ornate earrings' },
    { id: 6, name: 'Nose Ring', preview: 'acc-noseRing', promptValue: 'a nose ring' },
    { id: 7, name: 'Crown', preview: 'acc-crown', promptValue: 'a royal crown' },
    { id: 8, name: 'Headband', preview: 'acc-headband', promptValue: 'a headband' },
    { id: 9, name: 'Circlet', preview: 'acc-circlet', promptValue: 'a golden circlet' },
    { id: 10, name: 'Hood', preview: 'acc-hood', promptValue: 'a mysterious hood' },
  ],

  facialHair: [
    { id: 1, name: 'Clean Shaven', preview: 'fh-cleanShaven', promptValue: '' },
    { id: 2, name: 'Stubble', preview: 'fh-stubble', promptValue: 'light stubble' },
    { id: 3, name: 'Full Beard', preview: 'fh-fullBeard', promptValue: 'a full thick beard' },
    { id: 4, name: 'Goatee', preview: 'fh-goatee', promptValue: 'a pointed goatee' },
    { id: 5, name: 'Mustache', preview: 'fh-mustache', promptValue: 'a distinguished mustache' },
    { id: 6, name: 'Sideburns', preview: 'fh-sideburns', promptValue: 'thick sideburns' },
    { id: 7, name: 'Van Dyke', preview: 'fh-vanDyke', promptValue: 'a Van Dyke beard' },
    { id: 8, name: 'Soul Patch', preview: 'fh-soulPatch', promptValue: 'a soul patch' },
  ],

  skinTone: [
    { id: 1, name: 'Porcelain', preview: 'skin-porcelain', promptValue: 'porcelain pale' },
    { id: 2, name: 'Ivory', preview: 'skin-ivory', promptValue: 'ivory fair' },
    { id: 3, name: 'Sand', preview: 'skin-sand', promptValue: 'warm sand' },
    { id: 4, name: 'Honey', preview: 'skin-honey', promptValue: 'golden honey' },
    { id: 5, name: 'Caramel', preview: 'skin-caramel', promptValue: 'rich caramel' },
    { id: 6, name: 'Chestnut', preview: 'skin-chestnut', promptValue: 'warm chestnut' },
    { id: 7, name: 'Espresso', preview: 'skin-espresso', promptValue: 'deep espresso' },
    { id: 8, name: 'Obsidian', preview: 'skin-obsidian', promptValue: 'rich obsidian' },
    { id: 9, name: 'Elven Silver', preview: 'skin-elvenSilver', promptValue: 'ethereal silver' },
    { id: 10, name: 'Orc Green', preview: 'skin-orcGreen', promptValue: 'orcish green' },
    { id: 11, name: 'Demon Red', preview: 'skin-demonRed', promptValue: 'demonic crimson' },
    { id: 12, name: 'Frost Blue', preview: 'skin-frostBlue', promptValue: 'frost-touched blue' },
  ],

  age: [
    { id: 1, name: 'Child', preview: 'age-child', promptValue: 'young child' },
    { id: 2, name: 'Teen', preview: 'age-teen', promptValue: 'teenage' },
    { id: 3, name: 'Young Adult', preview: 'age-youngAdult', promptValue: 'young adult' },
    { id: 4, name: 'Adult', preview: 'age-adult', promptValue: 'adult' },
    { id: 5, name: 'Middle Age', preview: 'age-middleAge', promptValue: 'middle-aged' },
    { id: 6, name: 'Elder', preview: 'age-elder', promptValue: 'elderly wise' },
  ],

  bodyType: [
    { id: 1, name: 'Slim', preview: 'body-slim', promptValue: 'slim lean' },
    { id: 2, name: 'Athletic', preview: 'body-athletic', promptValue: 'athletic toned' },
    { id: 3, name: 'Muscular', preview: 'body-muscular', promptValue: 'heavily muscular' },
    { id: 4, name: 'Average', preview: 'body-average', promptValue: 'average' },
    { id: 5, name: 'Stocky', preview: 'body-stocky', promptValue: 'stocky sturdy' },
    { id: 6, name: 'Heavy', preview: 'body-heavy', promptValue: 'large heavy-set' },
  ],

  lighting: [
    { id: 1, name: 'Studio', preview: 'light-studio', promptValue: 'professional studio' },
    { id: 2, name: 'Golden Hour', preview: 'light-goldenHour', promptValue: 'warm golden hour' },
    { id: 3, name: 'Moonlight', preview: 'light-moonlight', promptValue: 'ethereal moonlight' },
    { id: 4, name: 'Dramatic', preview: 'light-dramatic', promptValue: 'dramatic chiaroscuro' },
    { id: 5, name: 'Neon', preview: 'light-neon', promptValue: 'vibrant neon' },
    { id: 6, name: 'Candlelight', preview: 'light-candlelight', promptValue: 'intimate candlelight' },
  ],

  background: [
    { id: 1, name: 'Transparent', preview: 'bg-transparent', promptValue: '' },
    { id: 2, name: 'Studio Gray', preview: 'bg-studioGray', promptValue: 'neutral gray studio' },
    { id: 3, name: 'Deep Black', preview: 'bg-deepBlack', promptValue: 'pure black' },
    { id: 4, name: 'Gradient Blue', preview: 'bg-gradientBlue', promptValue: 'gradient blue atmospheric' },
    { id: 5, name: 'Fantasy Forest', preview: 'bg-fantasyForest', promptValue: 'mystical forest' },
    { id: 6, name: 'Castle Interior', preview: 'bg-castleInterior', promptValue: 'medieval castle interior' },
  ],
};

export const getOptionsForCategory = (categoryId: CategoryId): CategoryOption[] =>
  CATEGORY_OPTIONS[categoryId] || [];
