/**
 * Curated Character Archetype Library
 * Pre-filled character templates with appearance, backstory, and AI prompts
 */

import { CharacterArchetype } from '@/app/types/Archetype';

export const ARCHETYPE_LIBRARY: CharacterArchetype[] = [
  // HERO ARCHETYPES
  {
    id: 'hero-reluctant-farm-boy',
    name: 'The Reluctant Hero',
    category: 'Hero',
    description: 'A humble young person thrust into greatness, initially resisting their destiny',
    backstory: 'Raised in a small farming village, never knowing their true heritage or the great destiny that awaits them. A quiet life shattered by the arrival of dark forces.',
    motivations: 'Protect loved ones, discover true identity, fulfill prophecy reluctantly',
    personality: 'Humble, brave when pushed, doubts own abilities, loyal to friends, grows from naive to wise',
    characterType: 'Protagonist',
    suggestedFactionRole: 'Member',
    appearance: {
      gender: 'Male',
      age: 'Young',
      skinColor: 'Fair with sun-kissed tan',
      bodyType: 'Athletic, lean from farm work',
      height: 'average',
      face: {
        shape: 'Oval with strong jaw',
        eyeColor: 'Bright blue',
        hairColor: 'Sandy blonde',
        hairStyle: 'Tousled, slightly overgrown',
        facialHair: 'Clean-shaven',
        features: 'Innocent eyes, determined brow, kind smile',
      },
      clothing: {
        style: 'Simple peasant clothing, earth tones, practical',
        color: 'Brown tunic, worn leather boots',
        accessories: 'Leather satchel, family heirloom pendant',
      },
      customFeatures: 'Small scar on left hand from farm accident',
    },
    imagePrompt: 'Young hero with sandy blonde hair and bright blue eyes, wearing simple brown peasant clothing and leather boots, humble farm boy with innocent yet determined expression, holding a family heirloom pendant, fantasy art style, cinematic lighting',
    storyPrompt: 'A reluctant hero from humble origins discovers their hidden destiny. Thrust into a world of danger and magic, they must overcome self-doubt and rise to meet challenges far beyond their simple upbringing. Their journey transforms them from an innocent farm worker to a legendary figure.',
    tags: ['farm-boy', 'chosen-one', 'reluctant', 'classic-hero'],
    genre: ['fantasy', 'all'],
    popularity: 95,
  },
  {
    id: 'hero-warrior-princess',
    name: 'The Warrior Princess',
    category: 'Hero',
    description: 'Noble-born fighter who defies tradition and leads with strength and compassion',
    backstory: 'Born into royalty but trained in combat from a young age. Rejected the passive role expected of her to become a skilled warrior and defender of her people.',
    motivations: 'Prove worth beyond birthright, protect kingdom, challenge gender norms',
    personality: 'Fierce, compassionate, stubborn, natural leader, struggles with duty vs. personal desires',
    characterType: 'Protagonist',
    suggestedFactionRole: 'Leader',
    appearance: {
      gender: 'Female',
      age: 'Young',
      skinColor: 'Bronze complexion',
      bodyType: 'Athletic, muscular, warrior build',
      height: 'tall',
      face: {
        shape: 'Heart-shaped with high cheekbones',
        eyeColor: 'Emerald green',
        hairColor: 'Raven black',
        hairStyle: 'Long, braided war style',
        facialHair: '',
        features: 'Sharp features, battle-ready gaze, regal bearing',
      },
      clothing: {
        style: 'Ornate armor with royal insignia, practical yet elegant',
        color: 'Silver armor with crimson accents, gold trim',
        accessories: 'Crown-helmet hybrid, ceremonial sword, royal signet ring',
      },
      customFeatures: 'Battle scar across right shoulder, royal birthmark on left wrist',
    },
    imagePrompt: 'Warrior princess with long black braided hair and emerald green eyes, wearing silver armor with crimson and gold accents, regal bearing with fierce expression, holding ornate sword, battle scar on shoulder, fantasy warrior art, heroic pose',
    storyPrompt: 'A princess who defied tradition to become a warrior leads her people through times of great peril. She fights not just with sword and shield, but with wisdom and compassion, proving that true strength comes from protecting those who cannot protect themselves.',
    tags: ['royalty', 'warrior', 'strong-female', 'leader'],
    genre: ['fantasy', 'historical', 'all'],
    popularity: 88,
  },

  // VILLAIN ARCHETYPES
  {
    id: 'villain-fallen-knight',
    name: 'The Fallen Knight',
    category: 'Villain',
    description: 'Once noble warrior corrupted by tragedy and desire for power',
    backstory: 'Former champion of the realm who lost everything in a single catastrophic event. Betrayed by those he served, he turned to dark powers seeking vengeance and control.',
    motivations: 'Revenge against former allies, reshape world order, justify past choices',
    personality: 'Bitter, calculating, haunted by past nobility, believes ends justify means',
    characterType: 'Antagonist',
    suggestedFactionRole: 'Leader',
    appearance: {
      gender: 'Male',
      age: 'Middle-aged',
      skinColor: 'Pale from years of darkness',
      bodyType: 'Powerful, battle-scarred',
      height: 'tall',
      face: {
        shape: 'Angular, hardened',
        eyeColor: 'Steel gray with dark circles',
        hairColor: 'Black with silver streaks',
        hairStyle: 'Shoulder-length, pulled back',
        facialHair: 'Short beard, well-groomed',
        features: 'Scarred face, haunted eyes, cruel smile',
      },
      clothing: {
        style: 'Dark corrupted armor, former knight regalia twisted',
        color: 'Black armor with crimson details, tattered cape',
        accessories: 'Cursed sword, broken holy symbol, dark crown',
      },
      customFeatures: 'Jagged scar across face, mark of dark corruption on chest',
    },
    imagePrompt: 'Fallen knight in black corrupted armor with crimson accents, steel gray haunted eyes, scarred face with cruel expression, tattered cape, wielding cursed sword, dark fantasy art, ominous atmosphere',
    storyPrompt: 'Once the greatest knight of the realm, now corrupted by tragedy and dark power. His fall from grace was not sudden but gradual, each compromise leading deeper into darkness. He believes his crusade of vengeance is righteous, making him all the more dangerous.',
    tags: ['tragic-villain', 'corrupted', 'knight', 'complex-antagonist'],
    genre: ['fantasy', 'horror', 'all'],
    popularity: 82,
  },
  {
    id: 'villain-mad-scientist',
    name: 'The Mad Scientist',
    category: 'Villain',
    description: 'Brilliant but unethical researcher who pursues knowledge without moral limits',
    backstory: 'Genius scientist ostracized from academic circles for unethical experiments. Now operates in secret, believing that scientific progress justifies any cost.',
    motivations: 'Unlock forbidden knowledge, prove superiority, reshape reality through science',
    personality: 'Brilliant, obsessive, lacks empathy, sees people as test subjects',
    characterType: 'Antagonist',
    suggestedFactionRole: 'Leader',
    appearance: {
      gender: 'Male',
      age: 'Middle-aged',
      skinColor: 'Pale from laboratory work',
      bodyType: 'Thin, neglects physical health',
      height: 'average',
      face: {
        shape: 'Gaunt, angular',
        eyeColor: 'Wild brown, bloodshot',
        hairColor: 'Gray-white, unkempt',
        hairStyle: 'Wild, standing on end',
        facialHair: 'Scraggly goatee',
        features: 'Manic eyes, twitching smile, deep wrinkles',
      },
      clothing: {
        style: 'Stained lab coat, disheveled professional attire',
        color: 'White lab coat with chemical stains, dark vest',
        accessories: 'Cracked goggles, multiple syringes, strange devices',
      },
      customFeatures: 'Chemical burns on hands, cybernetic eye implant',
    },
    imagePrompt: 'Mad scientist with wild gray-white hair and manic brown eyes, wearing stained lab coat and cracked goggles, gaunt face with twisted smile, holding strange scientific devices, cybernetic eye, dark laboratory background, sci-fi horror art',
    storyPrompt: 'A brilliant mind twisted by obsession and exile from the scientific community. His experiments blur the line between genius and madness, creating wonders and horrors in equal measure. He sees morality as a constraint on true progress.',
    tags: ['scientist', 'obsessive', 'unethical', 'genius'],
    genre: ['sci-fi', 'horror', 'all'],
    popularity: 76,
  },

  // MENTOR ARCHETYPES
  {
    id: 'mentor-wise-elder',
    name: 'The Wise Elder',
    category: 'Mentor',
    description: 'Ancient sage who guides heroes with wisdom earned through long life',
    backstory: 'Lived for centuries, witnessed the rise and fall of kingdoms. Now spends final years passing knowledge to the next generation, having learned that true immortality is in the legacy we leave.',
    motivations: 'Guide young heroes, preserve ancient knowledge, prevent past mistakes from repeating',
    personality: 'Patient, wise, cryptic at times, kind but firm, sees the bigger picture',
    characterType: 'Supporting',
    suggestedFactionRole: 'Elder',
    appearance: {
      gender: 'Male',
      age: 'Elderly',
      skinColor: 'Weathered tan',
      bodyType: 'Frail but dignified',
      height: 'average',
      face: {
        shape: 'Wrinkled, kind',
        eyeColor: 'Pale blue, knowing',
        hairColor: 'White',
        hairStyle: 'Long beard, balding head',
        facialHair: 'Long flowing white beard',
        features: 'Gentle eyes, wise smile, weathered features',
      },
      clothing: {
        style: 'Ancient robes, traditional mage attire',
        color: 'Deep blue robes with silver embroidery',
        accessories: 'Gnarled wooden staff, ancient books, mystical amulet',
      },
      customFeatures: 'Faint mystical glow in eyes, runes tattooed on forearms',
    },
    imagePrompt: 'Ancient wise elder with long white beard and pale blue knowing eyes, wearing deep blue robes with silver embroidery, holding gnarled wooden staff, gentle mystical glow, weathered kind face, fantasy mentor art, magical atmosphere',
    storyPrompt: 'An ancient sage who has witnessed ages pass and kingdoms rise and fall. Their wisdom comes not from books alone but from lived experience and hard-won lessons. They guide the next generation while carrying the weight of their own past choices.',
    tags: ['wizard', 'ancient', 'wise', 'teacher'],
    genre: ['fantasy', 'all'],
    popularity: 90,
  },
  {
    id: 'mentor-grizzled-veteran',
    name: 'The Grizzled Veteran',
    category: 'Mentor',
    description: 'Battle-hardened soldier who teaches through tough love and hard experience',
    backstory: 'Survived countless battles and lost many comrades. Retired from active duty but drawn back to train new warriors, hoping to spare them the same mistakes and losses.',
    motivations: 'Keep young warriors alive, pass on hard-earned skills, honor fallen comrades',
    personality: 'Tough, gruff exterior hiding deep care, practical, cynical yet hopeful',
    characterType: 'Supporting',
    suggestedFactionRole: 'Advisor',
    appearance: {
      gender: 'Female',
      age: 'Middle-aged',
      skinColor: 'Weathered tan',
      bodyType: 'Muscular, battle-hardened',
      height: 'average',
      face: {
        shape: 'Square, strong jaw',
        eyeColor: 'Steel gray',
        hairColor: 'Dark brown with gray streaks',
        hairStyle: 'Short, practical military cut',
        facialHair: '',
        features: 'Battle scars, hardened expression, rare warm smile',
      },
      clothing: {
        style: 'Worn military uniform, practical armor pieces',
        color: 'Dark green military jacket, leather armor',
        accessories: 'Dog tags, combat knife, flask',
      },
      customFeatures: 'Multiple battle scars, missing tip of left ear, old burn marks',
    },
    imagePrompt: 'Grizzled female veteran with short gray-streaked hair and steel gray eyes, wearing worn military uniform and leather armor, battle scars across face, hardened expression, holding combat knife, military mentor art, realistic style',
    storyPrompt: 'A veteran of countless battles who has seen too many young soldiers fall. She trains new recruits with tough love, knowing that harsh training today saves lives tomorrow. Behind her gruff exterior beats a heart that cares deeply for those under her guidance.',
    tags: ['soldier', 'veteran', 'tough-love', 'military'],
    genre: ['sci-fi', 'historical', 'contemporary', 'all'],
    popularity: 79,
  },

  // TRICKSTER ARCHETYPES
  {
    id: 'trickster-charming-rogue',
    name: 'The Charming Rogue',
    category: 'Trickster',
    description: 'Smooth-talking thief with a heart of gold hidden beneath a roguish exterior',
    backstory: 'Grew up on the streets, learned to survive by wit and charm. Steals from the rich but has a code of honor that prevents harming innocents. Seeks redemption while living life on the edge.',
    motivations: 'Freedom, excitement, prove worth, protect the downtrodden',
    personality: 'Charming, witty, cocky, secretly noble, struggles with trust',
    characterType: 'Supporting',
    suggestedFactionRole: 'Scout',
    appearance: {
      gender: 'Male',
      age: 'Young',
      skinColor: 'Olive complexion',
      bodyType: 'Lean, agile',
      height: 'average',
      face: {
        shape: 'Handsome, roguish',
        eyeColor: 'Hazel with mischievous glint',
        hairColor: 'Dark brown',
        hairStyle: 'Stylishly messy',
        facialHair: 'Slight stubble',
        features: 'Crooked smile, playful eyes, small scar on chin',
      },
      clothing: {
        style: 'Fashionable but practical, swashbuckler style',
        color: 'Dark leather vest, burgundy shirt, black pants',
        accessories: 'Multiple hidden daggers, lockpicks, stolen jewelry',
      },
      customFeatures: 'Small scar on chin from first theft, tattoo of street gang on shoulder',
    },
    imagePrompt: 'Charming rogue with stylishly messy dark hair and mischievous hazel eyes, wearing dark leather vest and burgundy shirt, crooked playful smile, slight stubble, holding daggers, swashbuckler art style, dynamic pose',
    storyPrompt: 'A street-smart thief whose silver tongue and quick fingers have gotten him in and out of trouble countless times. Beneath the roguish charm lies a good heart struggling with his criminal past and desire for something more meaningful.',
    tags: ['thief', 'charming', 'rogue', 'redeemable'],
    genre: ['fantasy', 'historical', 'all'],
    popularity: 85,
  },

  // SAGE ARCHETYPES
  {
    id: 'sage-scholarly-detective',
    name: 'The Scholarly Detective',
    category: 'Sage',
    description: 'Brilliant investigator who solves mysteries through logic and deduction',
    backstory: 'Trained in both academic scholarship and investigative techniques. Uses encyclopedic knowledge and razor-sharp logic to solve cases others deem unsolvable. Driven by need to understand truth.',
    motivations: 'Pursue truth, solve puzzles, apply knowledge practically, justice through understanding',
    personality: 'Analytical, observant, socially awkward, obsessive about details, dry humor',
    characterType: 'Protagonist',
    suggestedFactionRole: 'Scholar',
    appearance: {
      gender: 'Female',
      age: 'Adult',
      skinColor: 'Fair',
      bodyType: 'Slender',
      height: 'average',
      face: {
        shape: 'Oval, intelligent',
        eyeColor: 'Sharp brown',
        hairColor: 'Auburn',
        hairStyle: 'Pulled back in practical bun',
        facialHair: '',
        features: 'Intense gaze, reading glasses, thoughtful expression',
      },
      clothing: {
        style: 'Professional Victorian-era detective attire',
        color: 'Dark gray suit, white blouse, burgundy vest',
        accessories: 'Magnifying glass, pocket watch, notebook and pen',
      },
      customFeatures: 'Ink stains on fingers from constant note-taking',
    },
    imagePrompt: 'Scholarly female detective with auburn hair in practical bun and sharp brown eyes, wearing Victorian-era gray suit and reading glasses, holding magnifying glass and notebook, intense analytical expression, mystery novel art, period accurate',
    storyPrompt: 'A brilliant mind that sees patterns where others see chaos. Her encyclopedic knowledge and deductive reasoning solve the most baffling mysteries, though her social awkwardness sometimes complicates investigations. Truth is her ultimate pursuit.',
    tags: ['detective', 'intellectual', 'investigator', 'logical'],
    genre: ['mystery', 'historical', 'contemporary', 'all'],
    popularity: 81,
  },

  // GUARDIAN ARCHETYPES
  {
    id: 'guardian-loyal-bodyguard',
    name: 'The Loyal Bodyguard',
    category: 'Guardian',
    description: 'Devoted protector who places duty and loyalty above all else',
    backstory: 'Sworn to protect a noble family from childhood. Their entire identity revolves around this sacred duty, viewing their charge\'s safety as more important than their own life.',
    motivations: 'Protect charge at all costs, honor family oath, prove unwavering loyalty',
    personality: 'Stoic, observant, utterly loyal, struggles with personal desires vs duty',
    characterType: 'Supporting',
    suggestedFactionRole: 'Guard',
    appearance: {
      gender: 'Male',
      age: 'Adult',
      skinColor: 'Dark brown',
      bodyType: 'Powerfully built, imposing',
      height: 'tall',
      face: {
        shape: 'Strong, square jaw',
        eyeColor: 'Dark brown, watchful',
        hairColor: 'Black',
        hairStyle: 'Shaved head',
        facialHair: 'Goatee',
        features: 'Alert eyes, stoic expression, small scars',
      },
      clothing: {
        style: 'Heavy protective armor, royal guard uniform',
        color: 'Silver-black armor with house colors',
        accessories: 'Large sword, shield with family crest, oath medallion',
      },
      customFeatures: 'Oath brand on left shoulder, multiple battle scars',
    },
    imagePrompt: 'Loyal bodyguard with shaved head and watchful dark eyes, wearing silver-black heavy armor, powerfully built imposing figure, holding large sword and shield with crest, stoic noble expression, fantasy guard art, protective stance',
    storyPrompt: 'Bound by sacred oath from childhood, this guardian has dedicated their entire life to protecting their charge. Their loyalty is unshakeable, their vigilance constant. They struggle between duty and personal feelings, always choosing duty.',
    tags: ['bodyguard', 'loyal', 'protector', 'duty-bound'],
    genre: ['fantasy', 'historical', 'all'],
    popularity: 74,
  },

  // INNOCENT ARCHETYPES
  {
    id: 'innocent-optimistic-healer',
    name: 'The Optimistic Healer',
    category: 'Innocent',
    description: 'Pure-hearted caregiver who sees good in everyone and heals with compassion',
    backstory: 'Raised in a temple dedicated to healing arts. Believes deeply in the power of compassion and the inherent goodness in all people. Their optimism is tested but never broken.',
    motivations: 'Heal suffering, spread kindness, prove that goodness can overcome darkness',
    personality: 'Kind, optimistic, naive about evil, determined to help, emotionally strong',
    characterType: 'Supporting',
    suggestedFactionRole: 'Healer',
    appearance: {
      gender: 'Female',
      age: 'Young',
      skinColor: 'Warm beige',
      bodyType: 'Petite, gentle',
      height: 'short',
      face: {
        shape: 'Round, youthful',
        eyeColor: 'Warm brown',
        hairColor: 'Honey blonde',
        hairStyle: 'Long, flowing with flowers woven in',
        facialHair: '',
        features: 'Kind eyes, gentle smile, glowing complexion',
      },
      clothing: {
        style: 'Simple temple robes, flowing and practical',
        color: 'White robes with green trim, natural fibers',
        accessories: 'Healing herbs pouch, prayer beads, water flask',
      },
      customFeatures: 'Faint glow when healing, floral tattoos on hands',
    },
    imagePrompt: 'Young female healer with honey blonde hair woven with flowers and warm brown kind eyes, wearing flowing white robes with green trim, gentle compassionate smile, faint healing glow, holding herbs pouch, fantasy healer art, soft lighting',
    storyPrompt: 'A healer whose faith in the goodness of people never wavers, even in the darkest times. She believes that compassion and kindness are the most powerful forces in the world, and her healing touch has saved countless lives.',
    tags: ['healer', 'innocent', 'optimistic', 'compassionate'],
    genre: ['fantasy', 'all'],
    popularity: 77,
  },

  // RULER ARCHETYPES
  {
    id: 'ruler-just-monarch',
    name: 'The Just Monarch',
    category: 'Ruler',
    description: 'Fair and wise ruler who bears the weight of leadership with grace',
    backstory: 'Ascended to throne young after tragic loss of parents. Learned to rule with wisdom and justice, putting the needs of the kingdom before personal desires. Beloved by people but lonely at the top.',
    motivations: 'Ensure prosperity and justice, protect kingdom, maintain peace, leave lasting legacy',
    personality: 'Wise, diplomatic, carries burden of responsibility, struggles with isolation',
    characterType: 'Protagonist',
    suggestedFactionRole: 'Leader',
    appearance: {
      gender: 'Female',
      age: 'Adult',
      skinColor: 'Rich brown',
      bodyType: 'Regal, poised',
      height: 'tall',
      face: {
        shape: 'Noble, elegant',
        eyeColor: 'Golden amber',
        hairColor: 'Black',
        hairStyle: 'Elaborate braids with gold thread',
        facialHair: '',
        features: 'Regal bearing, wise eyes, commanding presence',
      },
      clothing: {
        style: 'Ornate royal regalia, culturally rich',
        color: 'Deep purple gown with gold embroidery',
        accessories: 'Crown, royal scepter, ancestral jewelry, ceremonial rings',
      },
      customFeatures: 'Royal birthmark, elaborate henna designs for ceremonies',
    },
    imagePrompt: 'Just monarch queen with elaborate black braided hair and golden amber eyes, wearing deep purple royal gown with gold embroidery and crown, regal commanding presence, wise compassionate expression, ornate jewelry, fantasy royalty art, majestic',
    storyPrompt: 'A ruler who understands that true power comes from earning the love and respect of her people. She makes difficult decisions with wisdom and fairness, always considering the greater good even when it costs her personally.',
    tags: ['royalty', 'wise-ruler', 'just', 'leader'],
    genre: ['fantasy', 'historical', 'all'],
    popularity: 83,
  },
];

/**
 * Get archetypes by category
 */
export function getArchetypesByCategory(category: string): CharacterArchetype[] {
  return ARCHETYPE_LIBRARY.filter(archetype => archetype.category === category);
}

/**
 * Get archetypes by genre
 */
export function getArchetypesByGenre(genre: string): CharacterArchetype[] {
  return ARCHETYPE_LIBRARY.filter(
    archetype => archetype.genre.includes(genre as any) || archetype.genre.includes('all')
  );
}

/**
 * Search archetypes by name or tags
 */
export function searchArchetypes(searchTerm: string): CharacterArchetype[] {
  const term = searchTerm.toLowerCase();
  return ARCHETYPE_LIBRARY.filter(
    archetype =>
      archetype.name.toLowerCase().includes(term) ||
      archetype.description.toLowerCase().includes(term) ||
      archetype.tags.some(tag => tag.toLowerCase().includes(term))
  );
}

/**
 * Get all archetype categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ARCHETYPE_LIBRARY.map(a => a.category)));
}

/**
 * Get archetype by ID
 */
export function getArchetypeById(id: string): CharacterArchetype | undefined {
  return ARCHETYPE_LIBRARY.find(a => a.id === id);
}
