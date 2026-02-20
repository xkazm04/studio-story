/**
 * Mock Character Appearance Data
 * Physical appearance data for characters
 */

export interface CharAppearance {
  character_id: string;
  // Basic Attributes
  gender?: string;
  age?: string;
  skin_color?: string;
  body_type?: string;
  height?: string;
  // Facial Features
  face_shape?: string;
  eye_color?: string;
  hair_color?: string;
  hair_style?: string;
  facial_hair?: string;
  face_features?: string;
  // Clothing & Style
  clothing_style?: string;
  clothing_color?: string;
  clothing_accessories?: string;
  // Additional
  custom_features?: string;
  // AI Generation Prompt
  prompt?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export const mockCharAppearances: CharAppearance[] = [
  {
    character_id: 'char-1', // Aldric Stormwind
    gender: 'male',
    age: '35',
    skin_color: 'fair, weathered',
    body_type: 'athletic, muscular',
    height: 'tall (6\'2")',
    face_shape: 'strong jawline, angular',
    eye_color: 'steel blue',
    hair_color: 'dark brown with grey streaks',
    hair_style: 'short, swept back',
    facial_hair: 'short trimmed beard',
    face_features: 'scar across left cheek, intense gaze, noble bearing',
    clothing_style: 'knight armor, formal military',
    clothing_color: 'silver and blue',
    clothing_accessories: 'blue cape with silver trim, family crest medallion',
    custom_features: 'Silver Order insignia tattooed on forearm',
    prompt: 'A noble knight in his mid-thirties with steel blue eyes and dark brown hair streaked with grey. Strong angular jaw with a scar across the left cheek. Athletic muscular build, tall stature. Wearing polished silver armor with blue cape and family crest medallion. Short trimmed beard, intense determined gaze. Noble bearing of a seasoned warrior.',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    character_id: 'char-2', // Lyra Shadowmoon
    gender: 'female',
    age: '28',
    skin_color: 'pale, olive undertones',
    body_type: 'lithe, agile',
    height: 'average (5\'7")',
    face_shape: 'heart-shaped, delicate',
    eye_color: 'deep emerald green',
    hair_color: 'raven black',
    hair_style: 'long, often hooded or tied back',
    facial_hair: 'none',
    face_features: 'high cheekbones, sharp observant eyes, subtle smirk',
    clothing_style: 'dark leather, hooded cloak',
    clothing_color: 'black and dark purple',
    clothing_accessories: 'hidden daggers, shadow guild emblem pendant',
    custom_features: 'Shadow mark tattoo behind left ear',
    prompt: 'A mysterious rogue woman in her late twenties with striking emerald green eyes and raven black hair. Heart-shaped face with high cheekbones and a subtle knowing smirk. Lithe agile build suited for stealth. Pale skin with olive undertones. Wearing dark leather armor under a black hooded cloak with purple accents. Multiple hidden daggers visible. Sharp observant gaze that misses nothing.',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    character_id: 'char-3', // Theron Drakehart
    gender: 'male',
    age: '45',
    skin_color: 'bronze with scale-like patches',
    body_type: 'large, imposing',
    height: 'very tall (6\'6")',
    face_shape: 'rugged, strong features',
    eye_color: 'amber with vertical pupils',
    hair_color: 'black with red streaks',
    hair_style: 'long, wild, partially braided',
    facial_hair: 'thick beard with metal rings',
    face_features: 'dragon-like scales on cheekbones, glowing ember-like eyes',
    clothing_style: 'dragon-touched armor, tribal elements',
    clothing_color: 'black, red, and bronze',
    clothing_accessories: 'dragon tooth necklace, fire-resistant cloak',
    custom_features: 'Small horns emerging from forehead, heat radiates from skin',
    prompt: 'A dragon-touched warrior in his mid-forties with amber eyes featuring vertical dragon-like pupils. Bronze skin with patches of iridescent scales on cheekbones. Very tall imposing build. Long wild black hair with red streaks, partially braided. Thick beard decorated with metal rings. Small horns emerging from forehead. Wearing ancient dragon-touched armor in black and bronze. Ember-like glow emanates from within. Dragon tooth necklace around neck.',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    character_id: 'char-4', // Elara Brightshield
    gender: 'female',
    age: '26',
    skin_color: 'warm tan',
    body_type: 'athletic, toned',
    height: 'average (5\'8")',
    face_shape: 'oval, soft features',
    eye_color: 'warm amber',
    hair_color: 'golden blonde',
    hair_style: 'shoulder-length, often braided for combat',
    facial_hair: 'none',
    face_features: 'kind eyes, gentle smile, freckles across nose',
    clothing_style: 'paladin armor, ceremonial robes',
    clothing_color: 'white, gold, and silver',
    clothing_accessories: 'holy symbol amulet, flowing white cape',
    custom_features: 'Faint golden glow around hands when using healing magic',
    prompt: 'A young paladin woman in her mid-twenties with warm amber eyes and golden blonde shoulder-length hair often braided for combat. Oval face with soft features, kind eyes, gentle smile, and light freckles across her nose. Athletic toned build of a trained warrior. Warm tan skin. Wearing polished white and gold paladin armor with silver accents. Holy symbol amulet around neck. Flowing white cape. Faint golden radiance emanates from her when channeling divine power.',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  {
    character_id: 'char-5', // Marcus the Wanderer
    gender: 'male',
    age: '55',
    skin_color: 'dark, sun-weathered',
    body_type: 'lean, wiry',
    height: 'average (5\'10")',
    face_shape: 'weathered, lined with age',
    eye_color: 'grey',
    hair_color: 'grey',
    hair_style: 'long, unkempt',
    facial_hair: 'full grey beard',
    face_features: 'wise eyes, deep laugh lines, mysterious aura',
    clothing_style: 'worn traveling clothes',
    clothing_color: 'earth tones, faded browns and greens',
    clothing_accessories: 'walking staff with carved runes, worn leather satchel',
    custom_features: 'Ancient runes occasionally glow on his walking staff',
    prompt: 'A mysterious wanderer in his fifties with wise grey eyes and long unkempt grey hair. Weathered face lined with age showing deep laugh lines. Dark sun-weathered skin of someone who has traveled for decades. Lean wiry build. Full grey beard. Wearing worn traveling clothes in faded earth tones. Carries a gnarled walking staff carved with ancient runes. Worn leather satchel at his side. Has the bearing of someone who knows more than they reveal.',
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  },
];
