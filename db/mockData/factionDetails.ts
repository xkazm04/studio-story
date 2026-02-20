/**
 * Mock Faction Details Data (Events, Achievements, Lore)
 */

import { FactionEvent, FactionAchievement, FactionLore } from '@/app/types/Faction';
import { MOCK_USER_ID } from './constants';

export const mockFactionEvents: FactionEvent[] = [
  {
    id: 'event-1',
    faction_id: 'faction-1',
    title: 'Founding of the Silver Order',
    description:
      'The Silver Order was established by the great knight Sir Alderon the Brave, who united scattered bands of knights under one banner to protect the realm from darkness.',
    date: '1247-03-15',
    event_type: 'founding',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'event-2',
    faction_id: 'faction-1',
    title: 'Battle of Crystal Pass',
    description:
      "The Silver Order defended Crystal Pass against a massive dragon assault, preventing the enemy from reaching the capital. This battle cemented their reputation as the realm's protectors.",
    date: '1298-07-22',
    event_type: 'battle',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'event-3',
    faction_id: 'faction-1',
    title: 'Treaty of Dawn',
    description:
      'Historic peace treaty signed with the Dragon Clan after the Great War, establishing trade routes and mutual defense pacts.',
    date: '1305-01-01',
    event_type: 'alliance',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'event-4',
    faction_id: 'faction-2',
    title: 'First Dragon Bond',
    description:
      'The legendary warrior Kael forged the first bond with a wild dragon, beginning the tradition that would define the Dragon Clan.',
    date: '987-05-10',
    event_type: 'founding',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'event-5',
    faction_id: 'faction-2',
    title: "Discovery of Dragon's Nest",
    description:
      'The ancestral home of dragons was discovered in the Crimson Mountains, becoming the sacred grounds for the Dragon Clan.',
    date: '1102-11-30',
    event_type: 'discovery',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'event-6',
    faction_id: 'faction-3',
    title: 'Shadow Guild Emergence',
    description:
      'The Shadow Guild emerged from the underground, revealing themselves as master information brokers and covert operatives.',
    date: '1156-08-13',
    event_type: 'founding',
    created_by: MOCK_USER_ID,
    created_at: '2024-01-17T10:00:00Z',
  },
];

export const mockFactionAchievements: FactionAchievement[] = [
  {
    id: 'achievement-1',
    faction_id: 'faction-1',
    title: 'Realm Protectors',
    description: 'Successfully defended the realm from major threats for 50 consecutive years',
    icon_url: '🛡️',
    earned_date: '1300-01-01',
    members: ['char-1', 'char-4'],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'achievement-2',
    faction_id: 'faction-1',
    title: 'Peacemakers',
    description: 'Negotiated and maintained peaceful relations with former enemies',
    icon_url: '🕊️',
    earned_date: '1305-01-01',
    members: ['char-1', 'char-4'],
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'achievement-3',
    faction_id: 'faction-1',
    title: 'Elite Training Corps',
    description: 'Established the most prestigious knight training academy in the realm',
    icon_url: '⚔️',
    earned_date: '1290-06-15',
    members: ['char-1', 'char-4'],
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'achievement-4',
    faction_id: 'faction-2',
    title: 'Sky Masters',
    description: 'Achieved perfect harmony between riders and dragons',
    icon_url: '🐉',
    earned_date: '1200-03-20',
    members: ['char-3'],
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'achievement-5',
    faction_id: 'faction-2',
    title: 'Ancient Lineage',
    description: 'Maintained unbroken dragon bloodlines for over 300 years',
    icon_url: '🔥',
    earned_date: '1287-12-31',
    members: ['char-3'],
    created_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'achievement-6',
    faction_id: 'faction-3',
    title: 'Information Network',
    description: 'Established the most comprehensive intelligence network across all kingdoms',
    icon_url: '🕵️',
    earned_date: '1250-09-09',
    members: ['char-2'],
    created_at: '2024-01-17T10:00:00Z',
  },
];

export const mockFactionLore: FactionLore[] = [
  {
    id: 'lore-1',
    faction_id: 'faction-1',
    title: 'The Code of Silver',
    content: `The Code of Silver is the foundational document that guides all members of the Silver Order. Written by Sir Alderon himself, it outlines the principles of honor, courage, and selfless service.

## Core Tenets

1. **Honor Above All** - A knight's word is their bond
2. **Courage in Darkness** - Stand firm when others flee
3. **Protect the Innocent** - The weak shall find shelter in our strength
4. **Unity in Purpose** - Together we are unbreakable

The Code has been passed down through generations, with each knight taking a sacred oath to uphold these values until their final breath.`,
    category: 'history',
    created_at: '2024-01-15T10:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-2',
    faction_id: 'faction-1',
    title: 'The Silver Fortress',
    content: `Built into the side of Mount Argentum, the Silver Fortress serves as both the headquarters and training grounds for the Silver Order. The fortress is constructed from rare silversteel, which gleams brilliantly in the sunlight and is said to be nearly indestructible.

The fortress contains:
- The Grand Hall of Honor where ceremonies are held
- Training grounds that span several acres
- The Archive of Valor documenting every knight's deeds
- The Eternal Flame that has burned since the Order's founding`,
    category: 'culture',
    created_at: '2024-01-15T11:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-3',
    faction_id: 'faction-1',
    title: 'The Great War with Dragons',
    content: `For nearly a century, the Silver Order engaged in brutal conflict with the Dragon Clan. This period, known as the Dragon Wars, saw countless battles and tremendous loss on both sides.

The war began when a rogue dragon destroyed a border village, leading to escalating retaliation. It finally ended with the Treaty of Dawn, brokered by Sir Aldric Stormwind and Theron Drakehart's grandfather, who recognized that continued conflict would destroy both factions.`,
    category: 'conflicts',
    created_at: '2024-01-15T12:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-4',
    faction_id: 'faction-1',
    title: 'Sir Alderon the Brave',
    content: `The founder of the Silver Order, Sir Alderon was a legendary warrior who united scattered knights under one banner. Born to a humble blacksmith, Alderon showed exceptional courage from a young age.

His most famous deed was single-handedly defending a village from a band of marauders for three days until reinforcements arrived. This act of heroism inspired others to join his cause, eventually forming the Silver Order.

Alderon's silversteel sword, "Dawnbringer," is preserved in the Grand Hall and remains a symbol of the Order's enduring legacy.`,
    category: 'notable-figures',
    created_at: '2024-01-15T13:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-5',
    faction_id: 'faction-2',
    title: 'The First Bond',
    content: `The Dragon Clan's entire culture revolves around the sacred bond between rider and dragon. Legend tells of Kael the Fearless, who climbed the treacherous peaks of the Crimson Mountains and faced a wild dragon in its lair.

Rather than fighting, Kael spoke to the dragon in the ancient tongue, showing no fear. Moved by the human's courage and respect, the dragon, named Emberhorn, chose to bond with Kael. This partnership became the template for all future bonds, proving that trust and mutual respect are the foundation of the Dragon Clan's power.`,
    category: 'history',
    created_at: '2024-01-16T10:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-6',
    faction_id: 'faction-2',
    title: 'Dragon Bonding Ceremony',
    content: `When a young member of the Dragon Clan comes of age, they undergo the Bonding Ceremony. This sacred rite takes place at Dragon's Nest during the autumn equinox.

The ceremony involves:
- A week-long fast and meditation
- A solo journey to the dragon nesting grounds
- Offerings of precious gems and crafted weapons
- The "Call," where the initiate uses ancient dragon speech
- If accepted, a lifelong bond forms between rider and dragon

Not all who attempt the ceremony succeed. Those who fail are not shamed but find other ways to serve the Clan.`,
    category: 'culture',
    created_at: '2024-01-16T11:00:00Z',
    updated_by: MOCK_USER_ID,
  },
  {
    id: 'lore-7',
    faction_id: 'faction-3',
    title: 'The Shadow Network',
    content: `The Shadow Guild's true power lies not in combat but in information. They maintain an intricate network of informants, safe houses, and secret passages throughout every major city in the realm.

Guild members communicate using a complex cipher system that changes monthly. Each member knows only their direct contacts, ensuring the network cannot be compromised even if individuals are captured.

Their motto, "Knowledge is the sharpest blade," reflects their philosophy that information can topple kingdoms more effectively than any army.`,
    category: 'culture',
    created_at: '2024-01-17T10:00:00Z',
    updated_by: MOCK_USER_ID,
  },
];
