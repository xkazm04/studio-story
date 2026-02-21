/**
 * Static catalog of drum machines from danigb/samples CDN (CC0 license).
 * Uses raw.githubusercontent.com URLs (GitHub Pages baseUrl is broken).
 */

export const DRUM_MACHINE_BASE_URL =
  'https://raw.githubusercontent.com/danigb/samples/main/audio/drum-machines';

export interface DrumMachineSample {
  name: string;       // display name: "Kick 1"
  category: string;   // "kick", "snare", "hihat", etc.
  path: string;       // relative path: "kick/bd0000" or flat "kick"
}

export interface DrumMachine {
  id: string;         // directory name on GitHub: "TR-808"
  name: string;       // display name: "Roland TR-808"
  shortName: string;  // compact: "TR-808"
  samples: DrumMachineSample[];
}

export function getSampleUrl(
  machineId: string,
  path: string,
  format: 'ogg' | 'm4a' = 'ogg'
): string {
  return `${DRUM_MACHINE_BASE_URL}/${machineId}/${path}.${format}`;
}

export function groupByCategory(
  samples: DrumMachineSample[]
): Map<string, DrumMachineSample[]> {
  const map = new Map<string, DrumMachineSample[]>();
  for (const s of samples) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return map;
}

// Category display order
export const CATEGORY_ORDER = [
  'kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal',
  'cowbell', 'conga', 'rimshot', 'clave', 'maraca',
  'ride', 'crash', 'tambourine', 'other',
];

export const CATEGORY_LABELS: Record<string, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'Hi-Hat',
  clap: 'Clap',
  tom: 'Tom',
  cymbal: 'Cymbal',
  cowbell: 'Cowbell',
  conga: 'Conga',
  rimshot: 'Rimshot',
  clave: 'Clave',
  maraca: 'Maraca',
  ride: 'Ride',
  crash: 'Crash',
  tambourine: 'Tambourine',
  other: 'Other',
};

// ============ Drum Machine Catalog ============

export const DRUM_MACHINES: DrumMachine[] = [
  {
    id: 'TR-808',
    name: 'Roland TR-808',
    shortName: 'TR-808',
    samples: [
      // Kick (curated — tone/decay combos)
      { name: 'Kick Short',    category: 'kick',    path: 'kick/bd0000' },
      { name: 'Kick Mid',      category: 'kick',    path: 'kick/bd0050' },
      { name: 'Kick Deep',     category: 'kick',    path: 'kick/bd5000' },
      { name: 'Kick Long',     category: 'kick',    path: 'kick/bd7575' },
      // Snare
      { name: 'Snare Tight',   category: 'snare',   path: 'snare/sd0000' },
      { name: 'Snare Mid',     category: 'snare',   path: 'snare/sd0050' },
      { name: 'Snare Open',    category: 'snare',   path: 'snare/sd5050' },
      { name: 'Snare Bright',  category: 'snare',   path: 'snare/sd7575' },
      // Hi-Hat
      { name: 'HH Closed',     category: 'hihat',   path: 'hihat-close/ch' },
      { name: 'HH Open Short', category: 'hihat',   path: 'hihat-open/oh00' },
      { name: 'HH Open Mid',   category: 'hihat',   path: 'hihat-open/oh50' },
      { name: 'HH Open Long',  category: 'hihat',   path: 'hihat-open/oh75' },
      // Clap
      { name: 'Clap',          category: 'clap',    path: 'clap/cp' },
      // Toms
      { name: 'Tom Low',       category: 'tom',     path: 'tom-low/lt25' },
      { name: 'Tom Mid',       category: 'tom',     path: 'mid-tom/mt25' },
      { name: 'Tom High',      category: 'tom',     path: 'tom-hi/ht25' },
      // Cymbal
      { name: 'Cymbal Short',  category: 'cymbal',  path: 'cymbal/cy0000' },
      { name: 'Cymbal Long',   category: 'cymbal',  path: 'cymbal/cy7575' },
      // Percussion
      { name: 'Cowbell',       category: 'cowbell',  path: 'cowbell/cb' },
      { name: 'Clave',         category: 'clave',    path: 'clave/cl' },
      { name: 'Rimshot',       category: 'rimshot',  path: 'rimshot/rs' },
      { name: 'Maraca',        category: 'maraca',   path: 'maraca/ma' },
      // Congas
      { name: 'Conga High',    category: 'conga',   path: 'conga-hi/hc25' },
      { name: 'Conga Mid',     category: 'conga',   path: 'conga-mid/mc25' },
      { name: 'Conga Low',     category: 'conga',   path: 'conga-low/lc25' },
    ],
  },
  {
    id: '808-mini',
    name: '808 Mini',
    shortName: '808 Mini',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'kick' },
      { name: 'Snare 1',       category: 'snare',   path: 'snare-1' },
      { name: 'Snare 2',       category: 'snare',   path: 'snare-2' },
      { name: 'Snare 3',       category: 'snare',   path: 'snare-3' },
      { name: 'HH Closed 1',   category: 'hihat',   path: 'hhclosed-1' },
      { name: 'HH Closed 2',   category: 'hihat',   path: 'hhclosed-2' },
      { name: 'HH Open 1',     category: 'hihat',   path: 'hhopen-1' },
      { name: 'HH Open 2',     category: 'hihat',   path: 'hhopen-2' },
      { name: 'Crash',         category: 'crash',   path: 'crash' },
      { name: 'Ride',          category: 'ride',    path: 'ride' },
      { name: 'Tom High',      category: 'tom',     path: 'tom-high' },
      { name: 'Tom Mid',       category: 'tom',     path: 'tom-mid' },
      { name: 'Tom Low',       category: 'tom',     path: 'tom-low' },
    ],
  },
  {
    id: 'Casio-RZ1',
    name: 'Casio RZ-1',
    shortName: 'RZ-1',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'kick' },
      { name: 'Snare',         category: 'snare',   path: 'snare' },
      { name: 'Clap',          category: 'clap',    path: 'clap' },
      { name: 'HH Closed',     category: 'hihat',   path: 'hihat-closed' },
      { name: 'HH Open',       category: 'hihat',   path: 'hihat-open' },
      { name: 'Crash',         category: 'crash',   path: 'crash' },
      { name: 'Ride',          category: 'ride',    path: 'ride' },
      { name: 'Cowbell',       category: 'cowbell',  path: 'cowbell' },
      { name: 'Clave',         category: 'clave',    path: 'clave' },
      { name: 'Tom 1',         category: 'tom',     path: 'tom-1' },
      { name: 'Tom 2',         category: 'tom',     path: 'tom-2' },
      { name: 'Tom 3',         category: 'tom',     path: 'tom-3' },
    ],
  },
  {
    id: 'Casio-SK1',
    name: 'Casio SK-1',
    shortName: 'SK-1',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'kick' },
      { name: 'Snare',         category: 'snare',   path: 'snare' },
      { name: 'Hi-Hat',        category: 'hihat',   path: 'hithat' },
      { name: 'HH Open',       category: 'hihat',   path: 'hihat-open' },
      { name: 'Tom High',      category: 'tom',     path: 'tom-hi' },
      { name: 'Tom Low',       category: 'tom',     path: 'tom-low' },
    ],
  },
  {
    id: 'LM-2',
    name: 'LinnDrum LM-2',
    shortName: 'LM-2',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'kick' },
      { name: 'Kick Alt',      category: 'kick',    path: 'kick-alt' },
      { name: 'Snare High',    category: 'snare',   path: 'snare-h' },
      { name: 'Snare Mid',     category: 'snare',   path: 'snare-m' },
      { name: 'Snare Low',     category: 'snare',   path: 'snare-l' },
      { name: 'Clap',          category: 'clap',    path: 'clap' },
      { name: 'HH Closed',     category: 'hihat',   path: 'hhclosed' },
      { name: 'HH Closed Long',category: 'hihat',   path: 'hhclosed-long' },
      { name: 'HH Closed Short',category: 'hihat',  path: 'hhclosed-short' },
      { name: 'HH Open',       category: 'hihat',   path: 'hhopen' },
      { name: 'Crash',         category: 'crash',   path: 'crash' },
      { name: 'Ride',          category: 'ride',    path: 'ride' },
      { name: 'Cowbell',       category: 'cowbell',  path: 'cowbell' },
      { name: 'Cabasa',        category: 'other',   path: 'cabasa' },
      { name: 'Tambourine',    category: 'tambourine', path: 'tambourine' },
      { name: 'Stick High',    category: 'rimshot', path: 'stick-h' },
      { name: 'Stick Mid',     category: 'rimshot', path: 'stick-m' },
      { name: 'Stick Low',     category: 'rimshot', path: 'stick-l' },
      { name: 'Tom High+',     category: 'tom',     path: 'tom-hh' },
      { name: 'Tom High',      category: 'tom',     path: 'tom-h' },
      { name: 'Tom Mid',       category: 'tom',     path: 'tom-m' },
      { name: 'Tom Low',       category: 'tom',     path: 'tom-l' },
      { name: 'Tom Low-',      category: 'tom',     path: 'tom-ll' },
      { name: 'Conga High+',   category: 'conga',   path: 'conga-hh' },
      { name: 'Conga High',    category: 'conga',   path: 'conga-h' },
      { name: 'Conga Mid',     category: 'conga',   path: 'conga-m' },
      { name: 'Conga Low',     category: 'conga',   path: 'conga-l' },
      { name: 'Conga Low-',    category: 'conga',   path: 'conga-ll' },
      { name: 'Conga Low--',   category: 'conga',   path: 'conga-lll' },
    ],
  },
  {
    id: 'MFB-512',
    name: 'MFB-512',
    shortName: 'MFB-512',
    samples: [
      { name: 'Kick',          category: 'kick',    path: '512bdrum' },
      { name: 'Snare',         category: 'snare',   path: '512snare' },
      { name: 'Clap',          category: 'clap',    path: '512clap' },
      { name: 'HH Closed',     category: 'hihat',   path: '512hhcl' },
      { name: 'HH Open',       category: 'hihat',   path: '512hhop' },
      { name: 'Cymbal',        category: 'cymbal',  path: '512cymb' },
      { name: 'Tom High',      category: 'tom',     path: '512hitom' },
      { name: 'Tom Mid',       category: 'tom',     path: '512mdtom' },
      { name: 'Tom Low',       category: 'tom',     path: '512lotom' },
    ],
  },
  {
    id: 'Roland-CR-8000',
    name: 'Roland CR-8000',
    shortName: 'CR-8000',
    samples: [
      { name: 'Bass Drum',     category: 'kick',    path: 'cr8kbass' },
      { name: 'Snare',         category: 'snare',   path: 'cr8ksnar' },
      { name: 'Clap',          category: 'clap',    path: 'cr8kclap' },
      { name: 'HH Closed',     category: 'hihat',   path: 'cr8kchat' },
      { name: 'HH Open',       category: 'hihat',   path: 'cr8kohat' },
      { name: 'Cymbal',        category: 'cymbal',  path: 'cr8kcymb' },
      { name: 'Rimshot',       category: 'rimshot', path: 'cr8krim' },
      { name: 'Clave',         category: 'clave',    path: 'cr8kclav' },
      { name: 'Cowbell',       category: 'cowbell',  path: 'cr8kcowb' },
      { name: 'Tom High',      category: 'tom',     path: 'cr8khitm' },
      { name: 'Tom Low',       category: 'tom',     path: 'cr8klotm' },
      { name: 'Conga Low',     category: 'conga',   path: 'cr8klcng' },
      { name: 'Conga Mid',     category: 'conga',   path: 'cr8kmcng' },
    ],
  },
  {
    id: 'Sequential-Circuits-Drumtraks',
    name: 'Drumtraks',
    shortName: 'Drumtraks',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'dt_kick' },
      { name: 'Snare',         category: 'snare',   path: 'dt_snare' },
      { name: 'Clap',          category: 'clap',    path: 'dt_clap' },
      { name: 'HH Closed',     category: 'hihat',   path: 'dt_closedhat' },
      { name: 'HH Open',       category: 'hihat',   path: 'dt_openhat' },
      { name: 'Crash',         category: 'crash',   path: 'dt_crash' },
      { name: 'Ride',          category: 'ride',    path: 'dt_ride' },
      { name: 'Rimshot',       category: 'rimshot', path: 'dt_rimshot' },
      { name: 'Cowbell',       category: 'cowbell',  path: 'dt_cowbell' },
      { name: 'Cabasa',        category: 'other',   path: 'dt_cabasa' },
      { name: 'Tambourine',    category: 'tambourine', path: 'dt_tamborine' },
      { name: 'Tom 1',         category: 'tom',     path: 'dt_tom01' },
      { name: 'Tom 2',         category: 'tom',     path: 'dt_tom02' },
    ],
  },
  {
    id: 'Yamaha-MR10',
    name: 'Yamaha MR-10',
    shortName: 'MR-10',
    samples: [
      { name: 'Kick',          category: 'kick',    path: 'kick' },
      { name: 'Kick Alt',      category: 'kick',    path: 'kick1' },
      { name: 'Snare',         category: 'snare',   path: 'snare' },
      { name: 'Snare Short',   category: 'snare',   path: 'shortsn' },
      { name: 'HH Closed',     category: 'hihat',   path: 'chihat' },
      { name: 'HH Open',       category: 'hihat',   path: 'ohihat' },
      { name: 'HH Short',      category: 'hihat',   path: 'shorthi' },
      { name: 'Crash',         category: 'crash',   path: 'crash' },
      { name: 'Cymbal',        category: 'cymbal',  path: 'cymbal' },
      { name: 'Brush',         category: 'other',   path: 'brush' },
      { name: 'Shaker',        category: 'other',   path: 'shaker' },
      { name: 'Tom High',      category: 'tom',     path: 'hitom' },
      { name: 'Tom Mid',       category: 'tom',     path: 'midtom' },
      { name: 'Tom Low',       category: 'tom',     path: 'lowtom' },
    ],
  },
];

// Skipping Micro-Rhythmer-12 (only 3 samples, not useful as a standalone kit)
