/**
 * Mock Characters Data
 */

import { Character, Trait, CharRelationship } from '@/app/types/Character';

export const mockCharacters: Character[] = [
  {
    id: 'char-1',
    name: 'Aldric Stormwind',
    type: 'Key',
    project_id: 'proj-1',
    faction_id: 'faction-1',
    avatar_url: '',
    voice: 'deep-male',
  },
  {
    id: 'char-2',
    name: 'Lyra Shadowmoon',
    type: 'Key',
    project_id: 'proj-1',
    faction_id: 'faction-3',
    avatar_url: '',
    voice: 'female-mysterious',
  },
  {
    id: 'char-3',
    name: 'Theron Drakehart',
    type: 'Major',
    project_id: 'proj-1',
    faction_id: 'faction-2',
    avatar_url: '',
  },
  {
    id: 'char-4',
    name: 'Elara Brightshield',
    type: 'Major',
    project_id: 'proj-1',
    faction_id: 'faction-1',
    avatar_url: '',
  },
  {
    id: 'char-5',
    name: 'Marcus the Wanderer',
    type: 'Minor',
    project_id: 'proj-1',
    faction_id: undefined,
    avatar_url: '',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'char-6',
    name: 'Kael Voss',
    type: 'Key',
    project_id: 'proj-4',
    faction_id: 'faction-4',
    faction_role: 'Scholar',
    avatar_url: '',
    voice: 'calm-male',
  },
  {
    id: 'char-7',
    name: 'Sera Thannis',
    type: 'Key',
    project_id: 'proj-4',
    faction_id: 'faction-4',
    faction_role: 'Guardian',
    avatar_url: '',
    voice: 'determined-female',
  },
];

export const mockTraits: Trait[] = [
  {
    id: 'trait-1',
    character_id: 'char-1',
    type: 'background',
    description: 'Born into nobility, trained as a knight from childhood. Lost his family in the Dragon Wars.',
  },
  {
    id: 'trait-2',
    character_id: 'char-1',
    type: 'personality',
    description: 'Honorable, brave, and sometimes too rigid in his adherence to the code of knights.',
  },
  {
    id: 'trait-3',
    character_id: 'char-1',
    type: 'strengths',
    description: 'Master swordsman, natural leader, unwavering courage in battle.',
  },
  {
    id: 'trait-4',
    character_id: 'char-2',
    type: 'background',
    description: 'Grew up in the shadows of the city, trained by the Shadow Guild since she was a child.',
  },
  {
    id: 'trait-5',
    character_id: 'char-2',
    type: 'personality',
    description: "Cunning, mysterious, and fiercely independent. Trust doesn't come easily.",
  },
  {
    id: 'trait-6',
    character_id: 'char-2',
    type: 'motivations',
    description: "Seeks to uncover the truth about her parents' mysterious disappearance.",
  },
  // Kael Voss traits
  {
    id: 'trait-7',
    character_id: 'char-6',
    type: 'background',
    description: 'A Jedi Sentinel specializing in investigation and intelligence. Kael was discovered on the agri-world of Dantooine at age four and raised in the Jedi Temple on Coruscant. He was trained by the legendary archivist Master Dooku before Dooku left the Order, an event that left Kael quietly questioning institutional rigidity.',
  },
  {
    id: 'trait-8',
    character_id: 'char-6',
    type: 'personality',
    description: 'Methodical, empathetic, and deeply contemplative. Kael listens more than he speaks and trusts the Living Force to reveal what data cannot. He carries a quiet sadness from having witnessed too many conflicts that diplomacy arrived too late to prevent.',
  },
  {
    id: 'trait-9',
    character_id: 'char-6',
    type: 'motivations',
    description: 'Believes the Jedi have grown too detached from the suffering of ordinary people. He takes investigation assignments on Outer Rim worlds specifically to stay connected to the lives the Order is meant to protect.',
  },
  {
    id: 'trait-10',
    character_id: 'char-6',
    type: 'strengths',
    description: 'Exceptional Force sensitivity attuned to psychometry — he can read emotional imprints left on objects and places. Skilled lightsaber duelist (Form III, Soresu) focused on defense. Fluent in twelve languages including Huttese and Mando\'a.',
  },
  // Sera Thannis traits
  {
    id: 'trait-11',
    character_id: 'char-7',
    type: 'background',
    description: 'A Jedi Guardian and frontline peacekeeper from the industrial world of Corellia. Sera was the youngest Knight in her generation, having passed her Trials at nineteen after single-handedly resolving a hostage crisis on Nar Shaddaa. She was assigned as Kael\'s partner by the Council, who believed her decisiveness would balance his caution.',
  },
  {
    id: 'trait-12',
    character_id: 'char-7',
    type: 'personality',
    description: 'Bold, impatient, and fiercely protective of the innocent. Sera acts on instinct and trusts her combat skills to carry her through. She struggles with the Jedi teaching of non-attachment — she forms bonds quickly and fights hardest for people she cares about.',
  },
  {
    id: 'trait-13',
    character_id: 'char-7',
    type: 'motivations',
    description: 'Haunted by a failed mission where she arrived too late to save a village from a Mandalorian raid. She drives herself relentlessly to be faster, stronger, and more present — determined that no one else will die waiting for help that comes too late.',
  },
  {
    id: 'trait-14',
    character_id: 'char-7',
    type: 'strengths',
    description: 'Elite lightsaber combatant (Form V, Djem So) who combines raw power with acrobatic agility. Strong in telekinetic Force abilities. Natural leader who inspires courage in civilians and soldiers alike. Skilled pilot.',
  },
];

export const mockCharRelationships: CharRelationship[] = [
  {
    id: 'rel-1',
    character_a_id: 'char-1',
    character_b_id: 'char-2',
    description: "Reluctant allies. Aldric doesn't trust Lyra's methods, but respects her skills.",
    event_date: 'Before the story',
    relationship_type: 'complicated',
  },
  {
    id: 'rel-2',
    character_a_id: 'char-1',
    character_b_id: 'char-4',
    description: 'Mentor and protégé. Aldric trained Elara in the ways of the Silver Order.',
    event_date: 'Five years ago',
    relationship_type: 'positive',
  },
  {
    id: 'rel-3',
    character_a_id: 'char-2',
    character_b_id: 'char-3',
    description: 'Ancient rivalry between their clans makes cooperation difficult.',
    event_date: 'Childhood',
    relationship_type: 'negative',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'rel-4',
    character_a_id: 'char-6',
    character_b_id: 'char-7',
    description: 'Council-assigned partners with contrasting methods. Kael\'s patience tempers Sera\'s impulsiveness, while her decisiveness pushes him past analysis paralysis. A deep mutual respect is forming beneath their constant tactical disagreements.',
    event_date: 'Six months ago',
    relationship_type: 'positive',
  },
];
