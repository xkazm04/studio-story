/**
 * Mock Story Data (Acts and Scenes)
 */

import { Act } from '@/app/types/Act';
import { Scene } from '@/app/types/Scene';

export const mockActs: Act[] = [
  {
    id: 'act-1',
    name: 'Act 1: The Gathering Storm',
    project_id: 'proj-1',
    description: 'Introduction of main characters and the looming threat',
    order: 1,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'act-2',
    name: 'Act 2: Shadows Rising',
    project_id: 'proj-1',
    description: 'The conflict escalates and alliances are tested',
    order: 2,
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'act-3',
    name: 'Act 3: Final Confrontation',
    project_id: 'proj-1',
    description: 'The climactic battle and resolution',
    order: 3,
    created_at: '2024-01-17T10:00:00Z',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'act-4',
    name: 'Act 1: Echoes in the Ash',
    project_id: 'proj-4',
    description: 'Two Jedi investigators are dispatched to the Outer Rim after a farming village is found destroyed under mysterious circumstances. What begins as a routine inquiry reveals traces of the dark side and a conspiracy far larger than a single ruined settlement.',
    order: 1,
    created_at: '2024-04-01T09:00:00Z',
  },
];

export const mockScenes: Scene[] = [
  // Act 1 Scenes
  {
    id: 'scene-1',
    name: "The Knight's Oath",
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 1,
    description: 'Aldric takes his oath at the Silver Order',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'scene-2',
    name: 'Shadows in the Alley',
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 2,
    description: 'Lyra completes a dangerous mission',
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'scene-3',
    name: "Dragon's Warning",
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 3,
    description: 'Theron brings news of impending danger',
    created_at: '2024-01-15T12:00:00Z',
  },
  // Act 2 Scenes
  {
    id: 'scene-4',
    name: 'Unlikely Alliance',
    project_id: 'proj-1',
    act_id: 'act-2',
    order: 1,
    description: 'The heroes are forced to work together',
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'scene-5',
    name: 'The Hidden Fortress',
    project_id: 'proj-1',
    act_id: 'act-2',
    order: 2,
    description: "Discovery of the enemy's stronghold",
    created_at: '2024-01-16T11:00:00Z',
  },
  // Act 3 Scenes
  {
    id: 'scene-6',
    name: 'Battle for the Realm',
    project_id: 'proj-1',
    act_id: 'act-3',
    order: 1,
    description: 'The final epic battle begins',
    created_at: '2024-01-17T10:00:00Z',
  },
  // Star Wars: Ashes of the Outer Rim — Act 1
  {
    id: 'scene-7',
    name: 'The Village of Tuanul Shar',
    project_id: 'proj-4',
    act_id: 'act-4',
    order: 1,
    location: 'Ruins of Tuanul Shar, Jakku Outer Rim',
    description: 'Jedi Sentinel Kael Voss and Jedi Guardian Sera Thannis arrive at the destroyed farming village of Tuanul Shar on the desert world of Jakku. They must investigate what annihilated the settlement and determine whether the dark side was involved.',
    script: `FADE IN:

EXT. JAKKU — DESERT WASTES — DAY

Twin suns hang low over an ocean of rust-colored sand. A Republic shuttle descends through heat shimmer, its shadow racing across dune crests toward a dark smear on the horizon — the remains of a settlement.

INT. REPUBLIC SHUTTLE — CONTINUOUS

KAEL VOSS (mid-30s, lean, close-cropped dark hair, brown Jedi robes weathered from years of fieldwork) sits cross-legged in the cargo bay, eyes closed, palms resting on his knees. The Force moves through him like a slow tide.

SERA THANNIS (late 20s, athletic build, auburn hair pulled into a tight braid, lighter combat-ready Jedi tunic) stands in the cockpit doorway, arms folded.

SERA
We're two minutes out. You planning to meditate through the whole investigation?

Kael opens his eyes. They are pale gray, calm.

KAEL
I can already feel it.

SERA
Feel what?

KAEL
Pain. Terror. And something underneath — something cold. Like a hand pressing down on the Force itself.

Sera's jaw tightens. She reaches unconsciously for the lightsaber at her hip.

SERA
Then let's not keep them waiting.

EXT. TUANUL SHAR — VILLAGE RUINS — CONTINUOUS

The shuttle touches down at the edge of what was once a modest farming village. Now it is a graveyard of scorched clay walls and collapsed moisture vaporators. Smoke still curls from the wreckage. There are no bodies — but the shapes of people are burned into the walls like shadows after a detonation.

Kael descends the ramp first, boots crunching on crystallized sand — the heat that destroyed this place was intense enough to fuse the desert floor into glass.

Sera follows, scanning the perimeter. Her hand rests on her lightsaber hilt.

SERA
Republic patrol found this eighteen hours ago. They reported blaster fire... but this wasn't blasters.

She gestures at the fused ground, the shadow-burned walls.

SERA (CONT'D)
I've seen orbital bombardment that did less damage than this.

Kael crouches beside a collapsed wall. He pulls off one glove and places his bare palm against the scorched clay. His eyes drift shut.

KAEL
(strained)
Voices. Dozens of them. Screaming. But not from weapons fire — they were afraid before the attack began. Something was here. Walking among them.

He pulls his hand away sharply, flexing his fingers as though burned.

KAEL (CONT'D)
The Force is... wounded here. Whatever did this drew on the dark side. Deeply.

SERA
A Sith?

KAEL
(carefully)
The Sith have been extinct for a millennium. But this signature... it's not a rogue Force user losing control. This was focused. Ritualistic.

Sera moves through the ruins with a soldier's precision, checking corners, reading the geometry of destruction. She stops at the village center — a communal well, now cracked open, its water boiled away.

SERA
The destruction radiates outward from here. This was the epicenter.

She crouches and picks up a fragment of metal — twisted, half-melted. She holds it up to the light.

SERA (CONT'D)
This is beskar alloy. Mandalorian.

KAEL
(approaching)
Mandalorians working alongside a dark side user?

SERA
Or Mandalorian equipment acquired by someone else. Either way, this wasn't some random pirate raid, Kael. Someone planned this. Someone with resources and a connection to the Force that the Council needs to know about.

Kael stands at the edge of the cracked well, looking down into darkness. A faint wind rises from below — unnatural, carrying a whisper that only he can hear.

KAEL
There's something else. Below the village.

SERA
Tunnels?

KAEL
Older than tunnels. I'm sensing structures. Pre-Republic. And the dark side residue is strongest down there — whatever ritual happened, it wasn't aimed at the villagers. They were collateral.

He looks at Sera. For the first time, there is genuine unease in his eyes.

KAEL (CONT'D)
Someone came here to wake something up.

Sera ignites her lightsaber — the blue blade hums to life, casting sharp shadows across the ruins.

SERA
Then we'd better find out what.

She steps to the edge of the well and looks down.

SERA (CONT'D)
After you, Scholar.

Kael allows himself the ghost of a smile. He ignites his own blade — green, steady — and drops into the darkness.

Sera follows without hesitation.

The twin suns continue their slow arc above the silent, ash-covered ruins. In the distance, sand begins to cover the Republic shuttle.

FADE OUT.`,
    created_at: '2024-04-01T09:30:00Z',
  },
];
