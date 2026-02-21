/**
 * HierarchyEngine - Faction organizational hierarchy management
 *
 * Provides tree data structures, role templates, succession rules,
 * and chain of command visualization for faction organizations.
 */

// ============================================================================
// Types
// ============================================================================

export type OrganizationType = 'military' | 'corporate' | 'guild' | 'religious' | 'noble' | 'tribal' | 'custom';

export interface HierarchyRole {
  id: string;
  name: string;
  title: string;
  level: number; // 0 = top, higher = lower in hierarchy
  description: string;
  responsibilities: string[];
  permissions: RolePermission[];
  reports_to?: string; // Role ID this reports to
  can_have_multiple: boolean; // Can multiple people hold this role?
  max_holders?: number; // Maximum holders if can_have_multiple
  requirements?: string[]; // Requirements to hold this role
  color?: string;
  icon?: string;
}

export type RolePermission =
  | 'command_all'
  | 'command_subordinates'
  | 'recruit_members'
  | 'expel_members'
  | 'manage_resources'
  | 'declare_war'
  | 'form_alliances'
  | 'promote_members'
  | 'access_treasury'
  | 'access_secrets'
  | 'veto_decisions'
  | 'call_meetings'
  | 'represent_faction';

export interface HierarchyNode {
  id: string;
  role_id: string;
  character_id?: string; // Can be vacant
  character_name?: string;
  character_avatar?: string;
  parent_id?: string;
  children: string[]; // Node IDs
  position: { x: number; y: number }; // For visual positioning
  is_vacant: boolean;
  appointed_at?: string;
  appointed_by?: string;
}

export interface SuccessionRule {
  id: string;
  role_id: string;
  priority: number; // Lower = higher priority
  rule_type: SuccessionRuleType;
  condition?: SuccessionCondition;
  successor_role_id?: string; // Role that succeeds
  successor_character_id?: string; // Specific character
  description: string;
}

export type SuccessionRuleType =
  | 'hereditary' // Family line
  | 'elected' // Voted by members
  | 'appointed' // Chosen by superior
  | 'seniority' // Longest serving
  | 'merit' // Based on achievements
  | 'combat' // Trial by combat
  | 'divine' // Religious selection
  | 'automatic' // Next in line of specific role
  | 'custom';

export interface SuccessionCondition {
  type: 'role_held' | 'time_served' | 'achievement' | 'bloodline' | 'age' | 'custom';
  value: string;
  minimum?: number;
  comparison?: 'equals' | 'greater' | 'less' | 'contains';
}

export interface HierarchySnapshot {
  id: string;
  faction_id: string;
  timestamp: string;
  description: string;
  nodes: HierarchyNode[];
  event_trigger?: string; // What caused this snapshot
}

export interface FactionHierarchy {
  id: string;
  faction_id: string;
  faction_name: string;
  organization_type: OrganizationType;
  roles: HierarchyRole[];
  nodes: HierarchyNode[];
  succession_rules: SuccessionRule[];
  snapshots: HierarchySnapshot[];
  root_node_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CommandChainLink {
  from_node_id: string;
  to_node_id: string;
  relationship: 'commands' | 'advises' | 'supports' | 'coordinates';
  strength: 'direct' | 'indirect' | 'nominal';
}

export interface SuccessionCandidate {
  character_id: string;
  character_name: string;
  current_role?: string;
  succession_score: number;
  matching_rules: string[];
  disqualifications?: string[];
}

export interface VacancyCrisis {
  role_id: string;
  role_name: string;
  severity: 'minor' | 'moderate' | 'critical';
  affected_nodes: string[];
  succession_candidates: SuccessionCandidate[];
  recommendations: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const ORGANIZATION_TYPE_CONFIG: Record<OrganizationType, { label: string; description: string; icon: string }> = {
  military: { label: 'Military', description: 'Strict chain of command with ranks', icon: '⚔️' },
  corporate: { label: 'Corporate', description: 'Business hierarchy with departments', icon: '🏢' },
  guild: { label: 'Guild', description: 'Craft-based with masters and apprentices', icon: '🛠️' },
  religious: { label: 'Religious', description: 'Spiritual hierarchy with clergy', icon: '⛪' },
  noble: { label: 'Noble House', description: 'Hereditary titles and bloodlines', icon: '👑' },
  tribal: { label: 'Tribal', description: 'Elder-based with councils', icon: '🏕️' },
  custom: { label: 'Custom', description: 'Custom organizational structure', icon: '📊' },
};

export const ROLE_PERMISSION_CONFIG: Record<RolePermission, { label: string; description: string }> = {
  command_all: { label: 'Command All', description: 'Issue orders to any member' },
  command_subordinates: { label: 'Command Subordinates', description: 'Issue orders to direct reports' },
  recruit_members: { label: 'Recruit Members', description: 'Accept new members into the faction' },
  expel_members: { label: 'Expel Members', description: 'Remove members from the faction' },
  manage_resources: { label: 'Manage Resources', description: 'Control faction resources and inventory' },
  declare_war: { label: 'Declare War', description: 'Initiate conflicts with other factions' },
  form_alliances: { label: 'Form Alliances', description: 'Create partnerships with other factions' },
  promote_members: { label: 'Promote Members', description: 'Advance members to higher ranks' },
  access_treasury: { label: 'Access Treasury', description: 'View and use faction funds' },
  access_secrets: { label: 'Access Secrets', description: 'Know classified faction information' },
  veto_decisions: { label: 'Veto Decisions', description: 'Override council or committee decisions' },
  call_meetings: { label: 'Call Meetings', description: 'Convene faction gatherings' },
  represent_faction: { label: 'Represent Faction', description: 'Speak officially for the faction' },
};

export const SUCCESSION_RULE_CONFIG: Record<SuccessionRuleType, { label: string; description: string }> = {
  hereditary: { label: 'Hereditary', description: 'Passed to family members' },
  elected: { label: 'Elected', description: 'Chosen by vote of members' },
  appointed: { label: 'Appointed', description: 'Selected by superior authority' },
  seniority: { label: 'Seniority', description: 'Longest serving member advances' },
  merit: { label: 'Merit-Based', description: 'Based on achievements and performance' },
  combat: { label: 'Trial by Combat', description: 'Winner of combat challenge' },
  divine: { label: 'Divine Selection', description: 'Chosen through religious rite' },
  automatic: { label: 'Automatic', description: 'Next in line by role hierarchy' },
  custom: { label: 'Custom', description: 'Custom succession rules' },
};

// ============================================================================
// Role Templates
// ============================================================================

export interface RoleTemplate {
  id: string;
  name: string;
  organization_type: OrganizationType;
  description: string;
  roles: Omit<HierarchyRole, 'id'>[];
  default_succession: Omit<SuccessionRule, 'id' | 'role_id'>[];
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'military_standard',
    name: 'Standard Military',
    organization_type: 'military',
    description: 'Traditional military ranks from General to Private',
    roles: [
      {
        name: 'general',
        title: 'General',
        level: 0,
        description: 'Supreme commander of all forces',
        responsibilities: ['Strategic planning', 'Final command authority', 'External relations'],
        permissions: ['command_all', 'declare_war', 'form_alliances', 'access_secrets'],
        can_have_multiple: false,
        color: '#ffd700',
      },
      {
        name: 'colonel',
        title: 'Colonel',
        level: 1,
        description: 'Commands a regiment or major unit',
        responsibilities: ['Tactical planning', 'Unit management', 'Officer training'],
        permissions: ['command_subordinates', 'promote_members', 'access_secrets'],
        reports_to: 'general',
        can_have_multiple: true,
        max_holders: 4,
        color: '#c0c0c0',
      },
      {
        name: 'captain',
        title: 'Captain',
        level: 2,
        description: 'Commands a company',
        responsibilities: ['Company operations', 'Training oversight', 'Mission execution'],
        permissions: ['command_subordinates', 'recruit_members'],
        reports_to: 'colonel',
        can_have_multiple: true,
        color: '#cd7f32',
      },
      {
        name: 'lieutenant',
        title: 'Lieutenant',
        level: 3,
        description: 'Commands a platoon',
        responsibilities: ['Platoon leadership', 'Direct combat command'],
        permissions: ['command_subordinates'],
        reports_to: 'captain',
        can_have_multiple: true,
        color: '#4a90d9',
      },
      {
        name: 'sergeant',
        title: 'Sergeant',
        level: 4,
        description: 'Senior enlisted, leads squads',
        responsibilities: ['Squad leadership', 'Soldier training', 'Discipline'],
        permissions: ['command_subordinates'],
        reports_to: 'lieutenant',
        can_have_multiple: true,
        color: '#2e8b57',
      },
      {
        name: 'private',
        title: 'Private',
        level: 5,
        description: 'Basic soldier',
        responsibilities: ['Follow orders', 'Combat duties'],
        permissions: [],
        reports_to: 'sergeant',
        can_have_multiple: true,
        color: '#708090',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'seniority', description: 'Longest serving officer of next rank' },
      { priority: 2, rule_type: 'merit', description: 'Most decorated officer' },
      { priority: 3, rule_type: 'appointed', description: 'Appointed by superior' },
    ],
  },
  {
    id: 'corporate_standard',
    name: 'Standard Corporate',
    organization_type: 'corporate',
    description: 'Corporate hierarchy from CEO to employees',
    roles: [
      {
        name: 'ceo',
        title: 'CEO',
        level: 0,
        description: 'Chief Executive Officer',
        responsibilities: ['Company vision', 'Board relations', 'Final decisions'],
        permissions: ['command_all', 'manage_resources', 'access_treasury', 'represent_faction'],
        can_have_multiple: false,
        color: '#1a1a2e',
      },
      {
        name: 'cto',
        title: 'CTO',
        level: 1,
        description: 'Chief Technology Officer',
        responsibilities: ['Technical strategy', 'R&D oversight', 'Innovation'],
        permissions: ['command_subordinates', 'manage_resources', 'access_secrets'],
        reports_to: 'ceo',
        can_have_multiple: false,
        color: '#16213e',
      },
      {
        name: 'cfo',
        title: 'CFO',
        level: 1,
        description: 'Chief Financial Officer',
        responsibilities: ['Financial planning', 'Budgeting', 'Investor relations'],
        permissions: ['access_treasury', 'manage_resources'],
        reports_to: 'ceo',
        can_have_multiple: false,
        color: '#0f3460',
      },
      {
        name: 'director',
        title: 'Director',
        level: 2,
        description: 'Department head',
        responsibilities: ['Department management', 'Strategy execution'],
        permissions: ['command_subordinates', 'recruit_members', 'promote_members'],
        reports_to: 'cto',
        can_have_multiple: true,
        max_holders: 6,
        color: '#533483',
      },
      {
        name: 'manager',
        title: 'Manager',
        level: 3,
        description: 'Team lead',
        responsibilities: ['Team management', 'Project delivery'],
        permissions: ['command_subordinates'],
        reports_to: 'director',
        can_have_multiple: true,
        color: '#e94560',
      },
      {
        name: 'employee',
        title: 'Employee',
        level: 4,
        description: 'Individual contributor',
        responsibilities: ['Task execution', 'Team collaboration'],
        permissions: [],
        reports_to: 'manager',
        can_have_multiple: true,
        color: '#0f4c75',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'appointed', description: 'Board appointment' },
      { priority: 2, rule_type: 'merit', description: 'Performance-based promotion' },
    ],
  },
  {
    id: 'guild_standard',
    name: 'Artisan Guild',
    organization_type: 'guild',
    description: 'Traditional craft guild structure',
    roles: [
      {
        name: 'guildmaster',
        title: 'Guildmaster',
        level: 0,
        description: 'Head of the guild',
        responsibilities: ['Guild governance', 'Quality standards', 'External representation'],
        permissions: ['command_all', 'expel_members', 'represent_faction', 'call_meetings'],
        can_have_multiple: false,
        color: '#8b4513',
      },
      {
        name: 'master',
        title: 'Master',
        level: 1,
        description: 'Recognized master craftsman',
        responsibilities: ['Train apprentices', 'Produce masterworks', 'Vote on guild matters'],
        permissions: ['recruit_members', 'promote_members', 'call_meetings'],
        reports_to: 'guildmaster',
        can_have_multiple: true,
        requirements: ['10+ years experience', 'Completed masterwork'],
        color: '#b8860b',
      },
      {
        name: 'journeyman',
        title: 'Journeyman',
        level: 2,
        description: 'Skilled craftsman',
        responsibilities: ['Independent work', 'Assist masters'],
        permissions: [],
        reports_to: 'master',
        can_have_multiple: true,
        requirements: ['Completed apprenticeship'],
        color: '#cd853f',
      },
      {
        name: 'apprentice',
        title: 'Apprentice',
        level: 3,
        description: 'Learning the craft',
        responsibilities: ['Learn trade', 'Assist journeymen and masters'],
        permissions: [],
        reports_to: 'journeyman',
        can_have_multiple: true,
        color: '#deb887',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'elected', description: 'Elected by masters council' },
      { priority: 2, rule_type: 'seniority', description: 'Senior master assumes role' },
    ],
  },
  {
    id: 'religious_standard',
    name: 'Religious Order',
    organization_type: 'religious',
    description: 'Church or temple hierarchy',
    roles: [
      {
        name: 'high_priest',
        title: 'High Priest',
        level: 0,
        description: 'Supreme spiritual leader',
        responsibilities: ['Doctrine interpretation', 'Major ceremonies', 'Divine communion'],
        permissions: ['command_all', 'access_secrets', 'represent_faction', 'veto_decisions'],
        can_have_multiple: false,
        color: '#4b0082',
      },
      {
        name: 'bishop',
        title: 'Bishop',
        level: 1,
        description: 'Regional spiritual leader',
        responsibilities: ['Regional oversight', 'Ordain priests', 'Major blessings'],
        permissions: ['command_subordinates', 'promote_members', 'access_secrets'],
        reports_to: 'high_priest',
        can_have_multiple: true,
        max_holders: 7,
        color: '#8a2be2',
      },
      {
        name: 'priest',
        title: 'Priest',
        level: 2,
        description: 'Temple leader',
        responsibilities: ['Daily services', 'Community guidance', 'Ceremonies'],
        permissions: ['recruit_members', 'call_meetings'],
        reports_to: 'bishop',
        can_have_multiple: true,
        color: '#9370db',
      },
      {
        name: 'acolyte',
        title: 'Acolyte',
        level: 3,
        description: 'Priest in training',
        responsibilities: ['Assist priests', 'Study scriptures', 'Minor ceremonies'],
        permissions: [],
        reports_to: 'priest',
        can_have_multiple: true,
        color: '#ba55d3',
      },
      {
        name: 'initiate',
        title: 'Initiate',
        level: 4,
        description: 'New member',
        responsibilities: ['Learn faith', 'Serve temple'],
        permissions: [],
        reports_to: 'acolyte',
        can_have_multiple: true,
        color: '#dda0dd',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'divine', description: 'Divine revelation or omen' },
      { priority: 2, rule_type: 'elected', description: 'Council of bishops votes' },
      { priority: 3, rule_type: 'seniority', description: 'Eldest serving bishop' },
    ],
  },
  {
    id: 'noble_standard',
    name: 'Noble House',
    organization_type: 'noble',
    description: 'Hereditary noble hierarchy',
    roles: [
      {
        name: 'lord',
        title: 'Lord/Lady',
        level: 0,
        description: 'Head of the house',
        responsibilities: ['House leadership', 'Land management', 'Political alliances'],
        permissions: ['command_all', 'form_alliances', 'declare_war', 'access_treasury'],
        can_have_multiple: false,
        color: '#800020',
      },
      {
        name: 'heir',
        title: 'Heir',
        level: 1,
        description: 'Designated successor',
        responsibilities: ['Learn governance', 'Represent house', 'Military command'],
        permissions: ['command_subordinates', 'represent_faction'],
        reports_to: 'lord',
        can_have_multiple: false,
        requirements: ['Direct bloodline'],
        color: '#dc143c',
      },
      {
        name: 'consort',
        title: 'Consort',
        level: 1,
        description: 'Spouse of the lord',
        responsibilities: ['Household management', 'Social affairs', 'Advisory'],
        permissions: ['manage_resources', 'call_meetings'],
        reports_to: 'lord',
        can_have_multiple: false,
        color: '#c71585',
      },
      {
        name: 'knight',
        title: 'Knight',
        level: 2,
        description: 'Sworn warrior',
        responsibilities: ['Military service', 'Protect house', 'Train soldiers'],
        permissions: ['command_subordinates'],
        reports_to: 'heir',
        can_have_multiple: true,
        color: '#4169e1',
      },
      {
        name: 'steward',
        title: 'Steward',
        level: 2,
        description: 'Estate manager',
        responsibilities: ['Estate management', 'Staff oversight', 'Finances'],
        permissions: ['manage_resources', 'access_treasury', 'recruit_members'],
        reports_to: 'lord',
        can_have_multiple: false,
        color: '#2f4f4f',
      },
      {
        name: 'servant',
        title: 'Servant',
        level: 3,
        description: 'House staff',
        responsibilities: ['Serve the house', 'Daily duties'],
        permissions: [],
        reports_to: 'steward',
        can_have_multiple: true,
        color: '#696969',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'hereditary', description: 'Eldest child of current lord', condition: { type: 'bloodline', value: 'direct' } },
      { priority: 2, rule_type: 'hereditary', description: 'Siblings of current lord', condition: { type: 'bloodline', value: 'sibling' } },
      { priority: 3, rule_type: 'appointed', description: 'Named by current lord' },
    ],
  },
  {
    id: 'tribal_standard',
    name: 'Tribal Council',
    organization_type: 'tribal',
    description: 'Elder-based tribal governance',
    roles: [
      {
        name: 'chief',
        title: 'Chief',
        level: 0,
        description: 'Leader of the tribe',
        responsibilities: ['Tribal decisions', 'War leadership', 'External relations'],
        permissions: ['command_all', 'declare_war', 'form_alliances'],
        can_have_multiple: false,
        color: '#8b0000',
      },
      {
        name: 'elder',
        title: 'Elder',
        level: 1,
        description: 'Council member',
        responsibilities: ['Advise chief', 'Preserve traditions', 'Settle disputes'],
        permissions: ['call_meetings', 'veto_decisions'],
        reports_to: 'chief',
        can_have_multiple: true,
        max_holders: 7,
        requirements: ['50+ years old', 'Respected by tribe'],
        color: '#a0522d',
      },
      {
        name: 'shaman',
        title: 'Shaman',
        level: 1,
        description: 'Spiritual leader',
        responsibilities: ['Spiritual guidance', 'Healing', 'Rituals'],
        permissions: ['access_secrets', 'call_meetings'],
        reports_to: 'chief',
        can_have_multiple: false,
        color: '#6b8e23',
      },
      {
        name: 'warrior',
        title: 'Warrior',
        level: 2,
        description: 'Tribal defender',
        responsibilities: ['Defend tribe', 'Hunt', 'Raid'],
        permissions: [],
        reports_to: 'chief',
        can_have_multiple: true,
        color: '#b22222',
      },
      {
        name: 'hunter',
        title: 'Hunter',
        level: 2,
        description: 'Provides for tribe',
        responsibilities: ['Provide food', 'Scout territory'],
        permissions: [],
        reports_to: 'elder',
        can_have_multiple: true,
        color: '#556b2f',
      },
      {
        name: 'member',
        title: 'Member',
        level: 3,
        description: 'Tribe member',
        responsibilities: ['Support tribe', 'Participate in gatherings'],
        permissions: [],
        reports_to: 'elder',
        can_have_multiple: true,
        color: '#8b4513',
      },
    ],
    default_succession: [
      { priority: 1, rule_type: 'combat', description: 'Trial of strength' },
      { priority: 2, rule_type: 'elected', description: 'Council of elders vote' },
      { priority: 3, rule_type: 'hereditary', description: 'Chiefs bloodline' },
    ],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

export function generateHierarchyId(): string {
  return `hierarchy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRoleId(): string {
  return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSnapshotId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build tree structure from flat node array
 */
export function buildHierarchyTree(nodes: HierarchyNode[]): Map<string, HierarchyNode[]> {
  const tree = new Map<string, HierarchyNode[]>();

  nodes.forEach(node => {
    const parentId = node.parent_id || 'root';
    if (!tree.has(parentId)) {
      tree.set(parentId, []);
    }
    tree.get(parentId)!.push(node);
  });

  return tree;
}

/**
 * Get all descendants of a node
 */
export function getDescendants(nodeId: string, nodes: HierarchyNode[]): HierarchyNode[] {
  const descendants: HierarchyNode[] = [];
  const node = nodes.find(n => n.id === nodeId);

  if (!node) return descendants;

  const processChildren = (parentId: string) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    children.forEach(child => {
      descendants.push(child);
      processChildren(child.id);
    });
  };

  processChildren(nodeId);
  return descendants;
}

/**
 * Get chain of command from a node up to root
 */
export function getCommandChain(nodeId: string, nodes: HierarchyNode[]): HierarchyNode[] {
  const chain: HierarchyNode[] = [];
  let currentNode = nodes.find(n => n.id === nodeId);

  while (currentNode) {
    chain.unshift(currentNode);
    currentNode = currentNode.parent_id
      ? nodes.find(n => n.id === currentNode!.parent_id)
      : undefined;
  }

  return chain;
}

/**
 * Calculate hierarchy depth
 */
export function getHierarchyDepth(nodes: HierarchyNode[]): number {
  if (nodes.length === 0) return 0;

  let maxDepth = 0;
  const rootNodes = nodes.filter(n => !n.parent_id);

  const calculateDepth = (nodeId: string, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    const children = nodes.filter(n => n.parent_id === nodeId);
    children.forEach(child => calculateDepth(child.id, depth + 1));
  };

  rootNodes.forEach(root => calculateDepth(root.id, 1));
  return maxDepth;
}

/**
 * Find vacant positions
 */
export function findVacancies(nodes: HierarchyNode[], roles: HierarchyRole[]): VacancyCrisis[] {
  const vacancies: VacancyCrisis[] = [];

  const vacantNodes = nodes.filter(n => n.is_vacant);

  vacantNodes.forEach(node => {
    const role = roles.find(r => r.id === node.role_id);
    if (!role) return;

    // Determine severity
    const descendants = getDescendants(node.id, nodes);
    const filledDescendants = descendants.filter(d => !d.is_vacant);

    let severity: VacancyCrisis['severity'] = 'minor';
    if (role.level === 0) {
      severity = 'critical';
    } else if (filledDescendants.length > 5) {
      severity = 'moderate';
    }

    vacancies.push({
      role_id: role.id,
      role_name: role.title,
      severity,
      affected_nodes: [node.id, ...descendants.map(d => d.id)],
      succession_candidates: [],
      recommendations: [
        severity === 'critical'
          ? 'Immediate succession required to maintain organizational function'
          : 'Consider promoting from subordinate positions',
      ],
    });
  });

  return vacancies;
}

/**
 * Calculate succession candidates for a role
 */
export function calculateSuccessionCandidates(
  roleId: string,
  nodes: HierarchyNode[],
  roles: HierarchyRole[],
  rules: SuccessionRule[],
  characters: Array<{ id: string; name: string; role_id?: string }>
): SuccessionCandidate[] {
  const role = roles.find(r => r.id === roleId);
  if (!role) return [];

  const roleRules = rules
    .filter(r => r.role_id === roleId)
    .sort((a, b) => a.priority - b.priority);

  const candidates: SuccessionCandidate[] = [];

  characters.forEach(character => {
    let score = 0;
    const matchingRules: string[] = [];
    const disqualifications: string[] = [];

    roleRules.forEach(rule => {
      switch (rule.rule_type) {
        case 'automatic':
          if (rule.successor_role_id && character.role_id === rule.successor_role_id) {
            score += 100 / rule.priority;
            matchingRules.push(`Automatic succession from ${rule.successor_role_id}`);
          }
          break;
        case 'seniority':
          // Would need service time data
          score += 20 / rule.priority;
          matchingRules.push('Seniority considered');
          break;
        case 'merit':
          // Would need achievement data
          score += 15 / rule.priority;
          matchingRules.push('Merit considered');
          break;
        default:
          // Other rule types would need more data
          break;
      }
    });

    if (score > 0) {
      candidates.push({
        character_id: character.id,
        character_name: character.name,
        current_role: character.role_id,
        succession_score: score,
        matching_rules: matchingRules,
        disqualifications: disqualifications.length > 0 ? disqualifications : undefined,
      });
    }
  });

  return candidates.sort((a, b) => b.succession_score - a.succession_score);
}

/**
 * Auto-layout nodes in a tree structure
 */
export function autoLayoutNodes(
  nodes: HierarchyNode[],
  options: {
    horizontalSpacing?: number;
    verticalSpacing?: number;
    startX?: number;
    startY?: number;
  } = {}
): HierarchyNode[] {
  const {
    horizontalSpacing = 200,
    verticalSpacing = 120,
    startX = 400,
    startY = 50
  } = options;

  const layoutNodes = [...nodes];
  const tree = buildHierarchyTree(layoutNodes);

  // Calculate width needed for each subtree
  const subtreeWidths = new Map<string, number>();

  const calculateWidth = (nodeId: string): number => {
    const children = tree.get(nodeId) || [];
    if (children.length === 0) {
      subtreeWidths.set(nodeId, 1);
      return 1;
    }

    const width = children.reduce((sum, child) => sum + calculateWidth(child.id), 0);
    subtreeWidths.set(nodeId, width);
    return width;
  };

  // Position nodes
  const positionNode = (nodeId: string, x: number, y: number) => {
    const node = layoutNodes.find(n => n.id === nodeId);
    if (node) {
      node.position = { x, y };
    }

    const children = tree.get(nodeId) || [];
    if (children.length === 0) return;

    const totalWidth = (subtreeWidths.get(nodeId) || 1) * horizontalSpacing;
    let currentX = x - totalWidth / 2 + horizontalSpacing / 2;

    children.forEach(child => {
      const childWidth = (subtreeWidths.get(child.id) || 1) * horizontalSpacing;
      positionNode(child.id, currentX + childWidth / 2 - horizontalSpacing / 2, y + verticalSpacing);
      currentX += childWidth;
    });
  };

  // Start from root nodes
  const rootNodes = tree.get('root') || [];
  let rootX = startX;

  rootNodes.forEach(root => {
    calculateWidth(root.id);
    const width = (subtreeWidths.get(root.id) || 1) * horizontalSpacing;
    positionNode(root.id, rootX + width / 2, startY);
    rootX += width + horizontalSpacing;
  });

  return layoutNodes;
}

// ============================================================================
// HierarchyEngine Class
// ============================================================================

export class HierarchyEngine {
  private hierarchy: FactionHierarchy;

  constructor(hierarchy: FactionHierarchy) {
    this.hierarchy = hierarchy;
  }

  getHierarchy(): FactionHierarchy {
    return this.hierarchy;
  }

  // Role Management
  addRole(role: Omit<HierarchyRole, 'id'>): HierarchyRole {
    const newRole: HierarchyRole = {
      ...role,
      id: generateRoleId(),
    };
    this.hierarchy.roles.push(newRole);
    this.hierarchy.updated_at = new Date().toISOString();
    return newRole;
  }

  updateRole(roleId: string, updates: Partial<HierarchyRole>): HierarchyRole | null {
    const index = this.hierarchy.roles.findIndex(r => r.id === roleId);
    if (index === -1) return null;

    this.hierarchy.roles[index] = { ...this.hierarchy.roles[index], ...updates };
    this.hierarchy.updated_at = new Date().toISOString();
    return this.hierarchy.roles[index];
  }

  deleteRole(roleId: string): boolean {
    const index = this.hierarchy.roles.findIndex(r => r.id === roleId);
    if (index === -1) return false;

    // Remove nodes with this role
    this.hierarchy.nodes = this.hierarchy.nodes.filter(n => n.role_id !== roleId);

    // Remove succession rules for this role
    this.hierarchy.succession_rules = this.hierarchy.succession_rules.filter(
      r => r.role_id !== roleId && r.successor_role_id !== roleId
    );

    this.hierarchy.roles.splice(index, 1);
    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  // Node Management
  addNode(node: Omit<HierarchyNode, 'id' | 'children'>): HierarchyNode {
    const newNode: HierarchyNode = {
      ...node,
      id: generateNodeId(),
      children: [],
    };

    // Update parent's children array
    if (node.parent_id) {
      const parent = this.hierarchy.nodes.find(n => n.id === node.parent_id);
      if (parent) {
        parent.children.push(newNode.id);
      }
    }

    this.hierarchy.nodes.push(newNode);
    this.hierarchy.updated_at = new Date().toISOString();
    return newNode;
  }

  assignCharacterToNode(nodeId: string, characterId: string, characterName: string, characterAvatar?: string): boolean {
    const node = this.hierarchy.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.character_id = characterId;
    node.character_name = characterName;
    node.character_avatar = characterAvatar;
    node.is_vacant = false;
    node.appointed_at = new Date().toISOString();

    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  vacateNode(nodeId: string): boolean {
    const node = this.hierarchy.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.character_id = undefined;
    node.character_name = undefined;
    node.character_avatar = undefined;
    node.is_vacant = true;

    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  moveNode(nodeId: string, newParentId: string | undefined): boolean {
    const node = this.hierarchy.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    // Remove from old parent
    if (node.parent_id) {
      const oldParent = this.hierarchy.nodes.find(n => n.id === node.parent_id);
      if (oldParent) {
        oldParent.children = oldParent.children.filter(id => id !== nodeId);
      }
    }

    // Add to new parent
    if (newParentId) {
      const newParent = this.hierarchy.nodes.find(n => n.id === newParentId);
      if (newParent) {
        newParent.children.push(nodeId);
      }
    }

    node.parent_id = newParentId;
    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  deleteNode(nodeId: string, reassignChildren: boolean = false, newParentId?: string): boolean {
    const nodeIndex = this.hierarchy.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return false;

    const node = this.hierarchy.nodes[nodeIndex];

    // Handle children
    if (reassignChildren && node.children.length > 0) {
      node.children.forEach(childId => {
        const child = this.hierarchy.nodes.find(n => n.id === childId);
        if (child) {
          child.parent_id = newParentId || node.parent_id;
        }
      });

      // Update new parent's children
      const newParent = this.hierarchy.nodes.find(n => n.id === (newParentId || node.parent_id));
      if (newParent) {
        newParent.children.push(...node.children);
      }
    } else {
      // Delete all descendants
      const descendants = getDescendants(nodeId, this.hierarchy.nodes);
      const descendantIds = new Set(descendants.map(d => d.id));
      this.hierarchy.nodes = this.hierarchy.nodes.filter(n => !descendantIds.has(n.id));
    }

    // Remove from parent's children
    if (node.parent_id) {
      const parent = this.hierarchy.nodes.find(n => n.id === node.parent_id);
      if (parent) {
        parent.children = parent.children.filter(id => id !== nodeId);
      }
    }

    // Remove the node itself
    this.hierarchy.nodes.splice(nodeIndex, 1);
    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  // Succession Management
  addSuccessionRule(rule: Omit<SuccessionRule, 'id'>): SuccessionRule {
    const newRule: SuccessionRule = {
      ...rule,
      id: generateRuleId(),
    };
    this.hierarchy.succession_rules.push(newRule);
    this.hierarchy.updated_at = new Date().toISOString();
    return newRule;
  }

  deleteSuccessionRule(ruleId: string): boolean {
    const index = this.hierarchy.succession_rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    this.hierarchy.succession_rules.splice(index, 1);
    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  // Snapshots
  createSnapshot(description: string, eventTrigger?: string): HierarchySnapshot {
    const snapshot: HierarchySnapshot = {
      id: generateSnapshotId(),
      faction_id: this.hierarchy.faction_id,
      timestamp: new Date().toISOString(),
      description,
      nodes: JSON.parse(JSON.stringify(this.hierarchy.nodes)), // Deep copy
      event_trigger: eventTrigger,
    };

    this.hierarchy.snapshots.push(snapshot);
    this.hierarchy.updated_at = new Date().toISOString();
    return snapshot;
  }

  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.hierarchy.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    this.hierarchy.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
    this.hierarchy.updated_at = new Date().toISOString();
    return true;
  }

  // Analysis
  getVacancies(): VacancyCrisis[] {
    return findVacancies(this.hierarchy.nodes, this.hierarchy.roles);
  }

  getCommandChain(nodeId: string): HierarchyNode[] {
    return getCommandChain(nodeId, this.hierarchy.nodes);
  }

  getDescendants(nodeId: string): HierarchyNode[] {
    return getDescendants(nodeId, this.hierarchy.nodes);
  }

  getSuccessionCandidates(
    roleId: string,
    characters: Array<{ id: string; name: string; role_id?: string }>
  ): SuccessionCandidate[] {
    return calculateSuccessionCandidates(
      roleId,
      this.hierarchy.nodes,
      this.hierarchy.roles,
      this.hierarchy.succession_rules,
      characters
    );
  }

  autoLayout(): void {
    this.hierarchy.nodes = autoLayoutNodes(this.hierarchy.nodes);
    this.hierarchy.updated_at = new Date().toISOString();
  }

  // Template Application
  applyTemplate(template: RoleTemplate): void {
    // Clear existing roles and nodes
    this.hierarchy.roles = [];
    this.hierarchy.nodes = [];
    this.hierarchy.succession_rules = [];

    // Add roles from template
    const roleIdMap = new Map<string, string>();

    template.roles.forEach(roleData => {
      const role = this.addRole(roleData);
      roleIdMap.set(roleData.name, role.id);
    });

    // Update reports_to references
    this.hierarchy.roles.forEach(role => {
      if (role.reports_to && roleIdMap.has(role.reports_to)) {
        role.reports_to = roleIdMap.get(role.reports_to);
      }
    });

    // Add default succession rules
    template.default_succession.forEach(ruleData => {
      // Apply to all leadership roles
      const topRole = this.hierarchy.roles.find(r => r.level === 0);
      if (topRole) {
        this.addSuccessionRule({
          ...ruleData,
          role_id: topRole.id,
        });
      }
    });

    // Create initial nodes for the top role
    const topRole = this.hierarchy.roles.find(r => r.level === 0);
    if (topRole) {
      const rootNode = this.addNode({
        role_id: topRole.id,
        is_vacant: true,
        position: { x: 400, y: 50 },
      });
      this.hierarchy.root_node_id = rootNode.id;
    }

    this.hierarchy.organization_type = template.organization_type;
    this.hierarchy.updated_at = new Date().toISOString();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createEmptyHierarchy(factionId: string, factionName: string): FactionHierarchy {
  return {
    id: generateHierarchyId(),
    faction_id: factionId,
    faction_name: factionName,
    organization_type: 'custom',
    roles: [],
    nodes: [],
    succession_rules: [],
    snapshots: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
