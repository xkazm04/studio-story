export interface Character {
  id: string;
  name: string;
  type?: string;
  voice?: string;
  avatar_url?: string;
  project_id?: string;
  faction_id?: string | null;
  faction_role?: string;
  faction_rank?: number;
  transparent_avatar_url?: string;
  body_url?: string;
  transparent_body_url?: string;
}

// Predefined faction roles
export type FactionRole =
  | 'Leader'
  | 'Co-Leader'
  | 'Advisor'
  | 'Elder'
  | 'Member'
  | 'Recruit'
  | 'Guard'
  | 'Diplomat'
  | 'Scholar'
  | 'Merchant'
  | 'Craftsman'
  | 'Warrior'
  | 'Mage'
  | 'Healer'
  | 'Scout'
  | 'Other';

export const FACTION_ROLES: FactionRole[] = [
  'Leader',
  'Co-Leader',
  'Advisor',
  'Elder',
  'Member',
  'Recruit',
  'Guard',
  'Diplomat',
  'Scholar',
  'Merchant',
  'Craftsman',
  'Warrior',
  'Mage',
  'Healer',
  'Scout',
  'Other',
];

export interface Trait {
  id: string;
  character_id: string;
  description: string;
  type: string;
}

export interface CharRelationship {
  id: string;
  character_a_id: string;
  character_b_id: string;
  event_date?: string;
  description: string;
  act_id?: string | null;
  relationship_type?: string;
}

export interface Appearance {
  gender: 'Male' | 'Female' | string;
  age: 'Child' | 'Young' | 'Adult' | 'Middle-aged' | 'Elderly' | string;
  skinColor: string;
  bodyType: string;
  height: string;
  face: {
    shape: string;
    eyeColor: string;
    hairColor: string;
    hairStyle: string;
    facialHair: string;
    features: string;
  };
  clothing: {
    style: string;
    color: string;
    accessories: string;
  };
  customFeatures: string;
}

export const defaultAppearance: Appearance = {
  gender: "",
  age: "",
  skinColor: "",
  bodyType: "",
  height: "average",
  face: {
    shape: "",
    eyeColor: "",
    hairColor: "",
    hairStyle: "",
    facialHair: "",
    features: ""
  },
  clothing: {
    style: "",
    color: "",
    accessories: ""
  },
  customFeatures: ""
};
