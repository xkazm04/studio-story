/**
 * Template Corpus - Published project templates and trending themes
 * Used by AI-powered template generator to bootstrap new projects
 */

export interface TemplateCharacter {
  name: string;
  type: 'protagonist' | 'antagonist' | 'neutral';
  description?: string;
}

export interface TemplateObjective {
  name: string;
  description?: string;
}

export interface TemplateBeat {
  name: string;
  description: string;
  order?: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  type: 'story' | 'short' | 'edu';
  genre: string;
  description: string;
  keywords: string[];
  characters: TemplateCharacter[];
  objectives: TemplateObjective[];
  beats: TemplateBeat[];
  scriptSections?: {
    act: string;
    scene: string;
    content: string;
  }[];
  trending?: boolean;
  popularity?: number;
}

/**
 * Trending Story Templates
 */
export const STORY_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'hero-journey',
    name: "The Hero's Journey",
    type: 'story',
    genre: 'Adventure',
    description: 'A classic hero embarks on an epic quest, facing trials and emerging transformed. Perfect for fantasy and adventure stories.',
    keywords: ['hero', 'quest', 'transformation', 'adventure', 'fantasy', 'journey'],
    trending: true,
    popularity: 95,
    characters: [
      { name: 'Alex Storm', type: 'protagonist', description: 'A reluctant hero with hidden potential' },
      { name: 'The Shadow Lord', type: 'antagonist', description: 'Ancient evil threatening the realm' },
      { name: 'Sage Elderwood', type: 'neutral', description: 'Wise mentor guiding the hero' },
      { name: 'Kira Swift', type: 'neutral', description: 'Skilled companion and ally' },
    ],
    objectives: [
      { name: 'Defeat the Shadow Lord', description: 'Stop the ancient evil from consuming the world' },
      { name: 'Master the Ancient Power', description: 'Learn to control the mystical force within' },
      { name: 'Unite the Divided Kingdoms', description: 'Bring together fractured lands against common threat' },
    ],
    beats: [
      { name: 'Ordinary World', description: 'Hero living simple life in small village', order: 1 },
      { name: 'Call to Adventure', description: 'Village attacked, prophecy revealed', order: 2 },
      { name: 'Refusal of the Call', description: 'Hero doubts their ability, fears leaving home', order: 3 },
      { name: 'Meeting the Mentor', description: 'Sage Elderwood reveals hero\'s true heritage', order: 4 },
      { name: 'Crossing the Threshold', description: 'Hero leaves home, enters magical realm', order: 5 },
      { name: 'Tests and Trials', description: 'Series of challenges to prove worthiness', order: 6 },
      { name: 'The Ordeal', description: 'Face Shadow Lord in first confrontation, nearly defeated', order: 7 },
      { name: 'The Reward', description: 'Discover ancient artifact, master new powers', order: 8 },
      { name: 'The Road Back', description: 'Return with knowledge, Shadow Lord attacks kingdoms', order: 9 },
      { name: 'Final Battle', description: 'Epic confrontation with Shadow Lord', order: 10 },
      { name: 'Return Transformed', description: 'Hero returns home changed, peace restored', order: 11 },
    ],
    scriptSections: [
      {
        act: 'Act 1: The Beginning',
        scene: 'Village Morning',
        content: 'INT. VILLAGE SQUARE - DAWN\n\nAlex sweeps the cobblestones, dreaming of distant lands. Little does he know his ordinary life is about to change forever.'
      }
    ]
  },
  {
    id: 'murder-mystery',
    name: 'Murder at the Manor',
    type: 'story',
    genre: 'Mystery',
    description: 'A classic whodunit set in a grand estate. Everyone has secrets, everyone has motives.',
    keywords: ['mystery', 'detective', 'murder', 'suspense', 'investigation', 'secrets'],
    trending: true,
    popularity: 87,
    characters: [
      { name: 'Detective Helena Cross', type: 'protagonist', description: 'Brilliant investigator with troubled past' },
      { name: 'The Killer', type: 'antagonist', description: 'One of the guests hiding in plain sight' },
      { name: 'Lord Ashworth', type: 'neutral', description: 'Wealthy estate owner with dark secrets' },
      { name: 'Dr. Marcus Webb', type: 'neutral', description: 'Family physician, suspicious behavior' },
      { name: 'Lady Victoria', type: 'neutral', description: 'Glamorous socialite with mysterious past' },
    ],
    objectives: [
      { name: 'Identify the Killer', description: 'Uncover who murdered Lord Ashworth\'s business partner' },
      { name: 'Unravel the Conspiracy', description: 'Discover the web of blackmail and betrayal' },
      { name: 'Confront Your Past', description: 'Detective must face connection to the victim' },
    ],
    beats: [
      { name: 'The Murder', description: 'Body discovered in the library during gala', order: 1 },
      { name: 'Gather the Suspects', description: 'All guests confined to manor, interrogations begin', order: 2 },
      { name: 'First Clues', description: 'Mysterious letter, missing poison vial discovered', order: 3 },
      { name: 'False Lead', description: 'Butler appears guilty, but alibi checks out', order: 4 },
      { name: 'Second Death', description: 'Another victim, the killer is still active', order: 5 },
      { name: 'Hidden Connection', description: 'Detective discovers personal link to case', order: 6 },
      { name: 'The Trap', description: 'Set up plan to draw out the killer', order: 7 },
      { name: 'Revelation', description: 'Shocking identity of murderer revealed', order: 8 },
      { name: 'Confrontation', description: 'Final showdown with killer in secret passage', order: 9 },
      { name: 'Justice Served', description: 'Killer apprehended, motives explained', order: 10 },
    ],
  },
  {
    id: 'dystopian-rebellion',
    name: 'Rise of the Resistance',
    type: 'story',
    genre: 'Sci-Fi Dystopian',
    description: 'In a totalitarian future, a small group of rebels fights for freedom against an oppressive regime.',
    keywords: ['dystopian', 'rebellion', 'sci-fi', 'resistance', 'freedom', 'revolution'],
    trending: true,
    popularity: 92,
    characters: [
      { name: 'Maya Chen', type: 'protagonist', description: 'Programmer turned resistance leader' },
      { name: 'Premier Voss', type: 'antagonist', description: 'Ruthless leader of the Global State' },
      { name: 'Cipher', type: 'neutral', description: 'Anonymous hacker with unknown agenda' },
      { name: 'Commander Reeves', type: 'neutral', description: 'State enforcer questioning orders' },
    ],
    objectives: [
      { name: 'Expose the Truth', description: 'Reveal government lies to the public' },
      { name: 'Build the Resistance', description: 'Unite scattered rebel cells into unified force' },
      { name: 'Overthrow the Regime', description: 'Take down the totalitarian government' },
    ],
    beats: [
      { name: 'Controlled World', description: 'Life under constant surveillance established', order: 1 },
      { name: 'The Glitch', description: 'Maya discovers truth hidden in code', order: 2 },
      { name: 'First Contact', description: 'Resistance reaches out to Maya', order: 3 },
      { name: 'Joining the Fight', description: 'Maya commits to rebellion after tragedy', order: 4 },
      { name: 'Small Victories', description: 'Successful raids, propaganda broadcasts', order: 5 },
      { name: 'Betrayal', description: 'Mole in resistance leads to major losses', order: 6 },
      { name: 'Desperate Plan', description: 'One last chance to hack the central system', order: 7 },
      { name: 'The Uprising', description: 'Citizens rise up after truth revealed', order: 8 },
      { name: 'Final Stand', description: 'Battle at State headquarters', order: 9 },
      { name: 'New Dawn', description: 'Freedom won, but rebuilding begins', order: 10 },
    ],
  },
  {
    id: 'romantic-comedy',
    name: 'Second Chance at Love',
    type: 'story',
    genre: 'Romance',
    description: 'Former rivals forced to work together rediscover each other and find unexpected love.',
    keywords: ['romance', 'comedy', 'enemies to lovers', 'second chance', 'workplace'],
    trending: false,
    popularity: 78,
    characters: [
      { name: 'Emma Harrison', type: 'protagonist', description: 'Ambitious architect with guarded heart' },
      { name: 'Jake Morrison', type: 'protagonist', description: 'Charming developer, Emma\'s high school rival' },
      { name: 'Claire Bennett', type: 'neutral', description: 'Emma\'s best friend and voice of reason' },
      { name: 'Mr. Chen', type: 'neutral', description: 'Client forcing them to work together' },
    ],
    objectives: [
      { name: 'Win the Contract', description: 'Secure the major development project' },
      { name: 'Overcome Past Hurts', description: 'Deal with high school betrayal and misunderstandings' },
      { name: 'Find True Love', description: 'Open heart to second chance at happiness' },
    ],
    beats: [
      { name: 'Awkward Reunion', description: 'Emma and Jake meet after 10 years at pitch meeting', order: 1 },
      { name: 'Forced Partnership', description: 'Client demands they collaborate on project', order: 2 },
      { name: 'Old Wounds', description: 'Past conflicts resurface, tension escalates', order: 3 },
      { name: 'Working Together', description: 'Grudging cooperation reveals new sides', order: 4 },
      { name: 'Unexpected Chemistry', description: 'Late night work sessions, moments of connection', order: 5 },
      { name: 'The First Kiss', description: 'Passion overrides logic during storm', order: 6 },
      { name: 'Fear and Retreat', description: 'Emma pulls away, afraid of being hurt again', order: 7 },
      { name: 'The Misunderstanding', description: 'Jake\'s past actions explained, truth revealed', order: 8 },
      { name: 'Grand Gesture', description: 'Jake publicly declares love at presentation', order: 9 },
      { name: 'Happy Together', description: 'Emma chooses love, project succeeds', order: 10 },
    ],
  },
];

/**
 * Shorts Templates
 */
export const SHORTS_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'viral-hook',
    name: 'Viral Hook Formula',
    type: 'short',
    genre: 'Social Media',
    description: 'Attention-grabbing 60-second video optimized for viral engagement.',
    keywords: ['viral', 'social media', 'hook', 'trending', 'engagement'],
    trending: true,
    popularity: 94,
    characters: [],
    objectives: [
      { name: 'Capture Attention', description: 'Hook viewers in first 3 seconds' },
      { name: 'Deliver Value', description: 'Provide insight or entertainment' },
      { name: 'Drive Engagement', description: 'End with call-to-action' },
    ],
    beats: [
      { name: 'The Hook', description: 'Shocking statement or visual in first 3 seconds', order: 1 },
      { name: 'The Promise', description: 'Tell them what they\'ll learn/see', order: 2 },
      { name: 'The Delivery', description: '3 key points or story arc', order: 3 },
      { name: 'The Payoff', description: 'Satisfying conclusion or reveal', order: 4 },
      { name: 'The CTA', description: 'Like, share, follow call-to-action', order: 5 },
    ],
  },
  {
    id: 'product-showcase',
    name: 'Product Spotlight',
    type: 'short',
    genre: 'Marketing',
    description: 'Professional product demonstration highlighting features and benefits.',
    keywords: ['product', 'marketing', 'demo', 'features', 'benefits'],
    trending: false,
    popularity: 81,
    characters: [],
    objectives: [
      { name: 'Showcase Product', description: 'Display key features clearly' },
      { name: 'Demonstrate Value', description: 'Show how it solves problems' },
      { name: 'Drive Conversion', description: 'Encourage purchase or sign-up' },
    ],
    beats: [
      { name: 'Problem Introduction', description: 'Show pain point viewers recognize', order: 1 },
      { name: 'Product Reveal', description: 'Introduce solution elegantly', order: 2 },
      { name: 'Feature Highlights', description: 'Demonstrate 3 key capabilities', order: 3 },
      { name: 'Social Proof', description: 'Quick testimonial or stat', order: 4 },
      { name: 'Closing Offer', description: 'Special deal or next steps', order: 5 },
    ],
  },
];

/**
 * Educational Templates
 */
export const EDU_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'explainer-video',
    name: 'Concept Explainer',
    type: 'edu',
    genre: 'Educational',
    description: 'Break down complex topics into digestible, engaging lessons.',
    keywords: ['education', 'explainer', 'learning', 'tutorial', 'concept'],
    trending: true,
    popularity: 89,
    characters: [],
    objectives: [
      { name: 'Explain Concept', description: 'Make complex topic understandable' },
      { name: 'Maintain Engagement', description: 'Keep learners interested throughout' },
      { name: 'Ensure Retention', description: 'Help viewers remember key points' },
    ],
    beats: [
      { name: 'Why It Matters', description: 'Establish relevance and importance', order: 1 },
      { name: 'Big Picture', description: 'Overview of the concept', order: 2 },
      { name: 'Breaking It Down', description: 'Explain in simple terms with analogies', order: 3 },
      { name: 'Visual Examples', description: 'Show real-world applications', order: 4 },
      { name: 'Common Mistakes', description: 'Address misconceptions', order: 5 },
      { name: 'Practice Application', description: 'Give viewers task to try', order: 6 },
      { name: 'Key Takeaways', description: 'Summarize main points', order: 7 },
    ],
  },
  {
    id: 'documentary-format',
    name: 'Documentary Deep Dive',
    type: 'edu',
    genre: 'Documentary',
    description: 'Investigative journalism exploring important topics with depth and nuance.',
    keywords: ['documentary', 'journalism', 'investigation', 'research', 'analysis'],
    trending: true,
    popularity: 85,
    characters: [],
    objectives: [
      { name: 'Research Thoroughly', description: 'Gather comprehensive information' },
      { name: 'Present Balanced View', description: 'Show multiple perspectives' },
      { name: 'Inspire Action', description: 'Motivate viewers to learn more or act' },
    ],
    beats: [
      { name: 'Opening Question', description: 'Pose intriguing question or mystery', order: 1 },
      { name: 'Historical Context', description: 'Background and origins', order: 2 },
      { name: 'Current State', description: 'Where things stand today', order: 3 },
      { name: 'Expert Perspectives', description: 'Interview specialists and stakeholders', order: 4 },
      { name: 'The Conflict', description: 'Present different viewpoints', order: 5 },
      { name: 'Data and Evidence', description: 'Show research and facts', order: 6 },
      { name: 'Future Implications', description: 'What this means going forward', order: 7 },
      { name: 'Call to Awareness', description: 'Encourage informed engagement', order: 8 },
    ],
  },
];

/**
 * Combined corpus for AI template generation
 */
export const TEMPLATE_CORPUS: ProjectTemplate[] = [
  ...STORY_TEMPLATES,
  ...SHORTS_TEMPLATES,
  ...EDU_TEMPLATES,
];

/**
 * Get templates by project type
 */
export function getTemplatesByType(type: 'story' | 'short' | 'edu'): ProjectTemplate[] {
  return TEMPLATE_CORPUS.filter(template => template.type === type);
}

/**
 * Get trending templates
 */
export function getTrendingTemplates(): ProjectTemplate[] {
  return TEMPLATE_CORPUS.filter(template => template.trending)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATE_CORPUS.find(template => template.id === id);
}
