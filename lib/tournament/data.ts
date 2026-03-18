// 2026 NCAA Women's Basketball Tournament — Full 68-team bracket
// Selection Sunday: March 15, 2026
// First Four: March 18, 2026
// First Round: March 20-21, 2026

export type Region = 'UConn' | 'UCLA' | 'Texas' | 'South Carolina'

export interface Team {
  id: number
  name: string
  seed: number
  region: Region
  abbreviation: string
  isFirstFour?: boolean
}

export interface Matchup {
  id: string           // e.g. "UConn_R1_G1"
  region: Region
  round: number        // 1 = First Round, 2 = Second Round, etc.
  topTeamId: number
  bottomTeamId: number
  topSlot: string      // slot key for picks
  bottomSlot: string
}

// ============================================================
// TEAMS — 2026 NCAA Women's Tournament (68 teams)
// First Four: Nebraska/Richmond, Missouri State/SFA, Southern/Samford, Virginia/Arizona State
// ============================================================
export const TEAMS: Team[] = [
  // UConn Region
  { id: 1,  name: 'UConn',            seed: 1,  region: 'UConn',          abbreviation: 'UCONN' },
  { id: 2,  name: 'UT San Antonio',   seed: 16, region: 'UConn',          abbreviation: 'UTSA' },
  { id: 3,  name: 'Iowa State',       seed: 8,  region: 'UConn',          abbreviation: 'IAST' },
  { id: 4,  name: 'Syracuse',         seed: 9,  region: 'UConn',          abbreviation: 'SYR' },
  { id: 5,  name: 'Maryland',         seed: 5,  region: 'UConn',          abbreviation: 'MD' },
  { id: 6,  name: 'Murray State',     seed: 12, region: 'UConn',          abbreviation: 'MUR' },
  { id: 7,  name: 'North Carolina',   seed: 4,  region: 'UConn',          abbreviation: 'UNC' },
  { id: 8,  name: 'Western Illinois', seed: 13, region: 'UConn',          abbreviation: 'WIU' },
  { id: 9,  name: 'Notre Dame',       seed: 6,  region: 'UConn',          abbreviation: 'ND' },
  { id: 10, name: 'Fairfield',        seed: 11, region: 'UConn',          abbreviation: 'FAIR' },
  { id: 11, name: 'Ohio State',       seed: 3,  region: 'UConn',          abbreviation: 'OSU' },
  { id: 12, name: 'Howard',           seed: 14, region: 'UConn',          abbreviation: 'HOW' },
  { id: 13, name: 'Illinois',         seed: 7,  region: 'UConn',          abbreviation: 'ILL' },
  { id: 14, name: 'Colorado',         seed: 10, region: 'UConn',          abbreviation: 'COL' },
  { id: 15, name: 'Vanderbilt',       seed: 2,  region: 'UConn',          abbreviation: 'VAN' },
  { id: 16, name: 'High Point',       seed: 15, region: 'UConn',          abbreviation: 'HPU' },

  // UCLA Region
  { id: 17, name: 'UCLA',             seed: 1,  region: 'UCLA',           abbreviation: 'UCLA' },
  { id: 18, name: 'Cal Baptist',      seed: 16, region: 'UCLA',           abbreviation: 'CBU' },
  { id: 19, name: 'Oklahoma State',   seed: 8,  region: 'UCLA',           abbreviation: 'OKST' },
  { id: 20, name: 'Princeton',        seed: 9,  region: 'UCLA',           abbreviation: 'PRIN' },
  { id: 21, name: 'Ole Miss',         seed: 5,  region: 'UCLA',           abbreviation: 'MISS' },
  { id: 22, name: 'Gonzaga',          seed: 12, region: 'UCLA',           abbreviation: 'GONZ' },
  { id: 23, name: 'Minnesota',        seed: 4,  region: 'UCLA',           abbreviation: 'MINN' },
  { id: 24, name: 'Green Bay',        seed: 13, region: 'UCLA',           abbreviation: 'GRBY' },
  { id: 25, name: 'Baylor',           seed: 6,  region: 'UCLA',           abbreviation: 'BAY' },
  { id: 26, name: 'Nebraska',         seed: 11, region: 'UCLA',           abbreviation: 'NEB',  isFirstFour: true },
  { id: 27, name: 'Richmond',         seed: 11, region: 'UCLA',           abbreviation: 'RICH', isFirstFour: true },
  { id: 28, name: 'Duke',             seed: 3,  region: 'UCLA',           abbreviation: 'DUKE' },
  { id: 29, name: 'Charleston',       seed: 14, region: 'UCLA',           abbreviation: 'CHA' },
  { id: 30, name: 'Texas Tech',       seed: 7,  region: 'UCLA',           abbreviation: 'TTU' },
  { id: 31, name: 'Villanova',        seed: 10, region: 'UCLA',           abbreviation: 'NOVA' },
  { id: 32, name: 'LSU',              seed: 2,  region: 'UCLA',           abbreviation: 'LSU' },
  { id: 33, name: 'Jacksonville',     seed: 15, region: 'UCLA',           abbreviation: 'JAX' },

  // Texas Region
  { id: 34, name: 'Texas',            seed: 1,  region: 'Texas',          abbreviation: 'TEX' },
  { id: 35, name: 'Missouri State',   seed: 16, region: 'Texas',          abbreviation: 'MST',  isFirstFour: true },
  { id: 36, name: 'Stephen F. Austin',seed: 16, region: 'Texas',          abbreviation: 'SFA',  isFirstFour: true },
  { id: 37, name: 'Oregon',           seed: 8,  region: 'Texas',          abbreviation: 'ORE' },
  { id: 38, name: 'Virginia Tech',    seed: 9,  region: 'Texas',          abbreviation: 'VT' },
  { id: 39, name: 'Kentucky',         seed: 5,  region: 'Texas',          abbreviation: 'UK' },
  { id: 40, name: 'James Madison',    seed: 12, region: 'Texas',          abbreviation: 'JMU' },
  { id: 41, name: 'West Virginia',    seed: 4,  region: 'Texas',          abbreviation: 'WVU' },
  { id: 42, name: 'Miami (OH)',        seed: 13, region: 'Texas',          abbreviation: 'MIO' },
  { id: 43, name: 'Alabama',          seed: 6,  region: 'Texas',          abbreviation: 'ALA' },
  { id: 44, name: 'Rhode Island',     seed: 11, region: 'Texas',          abbreviation: 'URI' },
  { id: 45, name: 'Louisville',       seed: 3,  region: 'Texas',          abbreviation: 'LOU' },
  { id: 46, name: 'Vermont',          seed: 14, region: 'Texas',          abbreviation: 'UVM' },
  { id: 47, name: 'NC State',         seed: 7,  region: 'Texas',          abbreviation: 'NCST' },
  { id: 48, name: 'Tennessee',        seed: 10, region: 'Texas',          abbreviation: 'TENN' },
  { id: 49, name: 'Michigan',         seed: 2,  region: 'Texas',          abbreviation: 'MICH' },
  { id: 50, name: 'Holy Cross',       seed: 15, region: 'Texas',          abbreviation: 'HC' },

  // South Carolina Region
  { id: 51, name: 'South Carolina',   seed: 1,  region: 'South Carolina', abbreviation: 'SC' },
  { id: 52, name: 'Southern',         seed: 16, region: 'South Carolina', abbreviation: 'SOU',  isFirstFour: true },
  { id: 53, name: 'Samford',          seed: 16, region: 'South Carolina', abbreviation: 'SAM',  isFirstFour: true },
  { id: 54, name: 'Clemson',          seed: 8,  region: 'South Carolina', abbreviation: 'CLEM' },
  { id: 55, name: 'USC',              seed: 9,  region: 'South Carolina', abbreviation: 'USC' },
  { id: 56, name: 'Michigan State',   seed: 5,  region: 'South Carolina', abbreviation: 'MSU' },
  { id: 57, name: 'Colorado State',   seed: 12, region: 'South Carolina', abbreviation: 'CSU' },
  { id: 58, name: 'Oklahoma',         seed: 4,  region: 'South Carolina', abbreviation: 'OU' },
  { id: 59, name: 'Idaho',            seed: 13, region: 'South Carolina', abbreviation: 'IDA' },
  { id: 60, name: 'Washington',       seed: 6,  region: 'South Carolina', abbreviation: 'WASH' },
  { id: 61, name: 'South Dakota State',seed:11, region: 'South Carolina', abbreviation: 'SDST' },
  { id: 62, name: 'TCU',              seed: 3,  region: 'South Carolina', abbreviation: 'TCU' },
  { id: 63, name: 'UC San Diego',     seed: 14, region: 'South Carolina', abbreviation: 'UCSD' },
  { id: 64, name: 'Georgia',          seed: 7,  region: 'South Carolina', abbreviation: 'UGA' },
  { id: 65, name: 'Virginia',         seed: 10, region: 'South Carolina', abbreviation: 'UVA',  isFirstFour: true },
  { id: 66, name: 'Arizona State',    seed: 10, region: 'South Carolina', abbreviation: 'ASU',  isFirstFour: true },
  { id: 67, name: 'Iowa',             seed: 2,  region: 'South Carolina', abbreviation: 'IOWA' },
  { id: 68, name: 'Fairleigh Dickinson',seed:15,region: 'South Carolina', abbreviation: 'FDU' },
]

// Helper to find a team by id
export function getTeam(id: number): Team | undefined {
  return TEAMS.find(t => t.id === id)
}

// Helper to get teams by region and seed (returns both for First Four seeds)
export function getTeamsByRegionAndSeed(region: Region, seed: number): Team[] {
  return TEAMS.filter(t => t.region === region && t.seed === seed)
}

// First Round matchups per region (after First Four resolves)
// Format: [topSeed, bottomSeed] — standard NCAA bracket pairing
export const REGION_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
]

// Scoring per round
export const ROUND_POINTS: Record<number, number> = {
  1: 10,   // First Round (64)
  2: 20,   // Second Round (32)
  3: 40,   // Sweet Sixteen
  4: 80,   // Elite Eight
  5: 160,  // Final Four
  6: 320,  // Championship
}

export const ROUND_NAMES: Record<number, string> = {
  1: 'First Round',
  2: 'Second Round',
  3: 'Sweet Sixteen',
  4: 'Elite Eight',
  5: 'Final Four',
  6: 'Championship',
}

export const REGIONS: Region[] = ['UConn', 'UCLA', 'Texas', 'South Carolina']

// Get first-round teams for a region in bracket order
// Returns pairs of [topTeam, bottomTeam] for each of the 8 matchups
export function getRegionMatchups(region: Region): Array<{ top: Team, bottom: Team, matchupIndex: number }> {
  const regionTeams = TEAMS.filter(t => t.region === region && !t.isFirstFour)
  const firstFourTeams = TEAMS.filter(t => t.region === region && t.isFirstFour)

  return REGION_MATCHUPS.map(([topSeed, bottomSeed], idx) => {
    let top = regionTeams.find(t => t.seed === topSeed)!
    let bottom = regionTeams.find(t => t.seed === bottomSeed)!

    // If this seed has first four teams, show as "TBD (FF)"
    if (!top) {
      const ff = firstFourTeams.filter(t => t.seed === topSeed)
      top = ff[0] // Will show "First Four" label
    }
    if (!bottom) {
      const ff = firstFourTeams.filter(t => t.seed === bottomSeed)
      bottom = ff[0]
    }

    return { top, bottom, matchupIndex: idx }
  })
}

// Generate a pick key for storing in brackets JSONB
// Format: "R{region_index}_{round}_{game}"
export function pickKey(region: Region, round: number, game: number): string {
  const ri = REGIONS.indexOf(region)
  return `R${ri}_${round}_${game}`
}

// ── First Four play-in games ──────────────────────────────────────────
export interface FirstFourGame {
  key: string
  topTeamId: number
  bottomTeamId: number
  region: Region
  seed: number    // which seed slot this winner fills in R1
}

export const FIRST_FOUR: FirstFourGame[] = [
  { key: 'FF4_NEB_RICH', topTeamId: 26, bottomTeamId: 27, region: 'UCLA',           seed: 11 },
  { key: 'FF4_MST_SFA',  topTeamId: 35, bottomTeamId: 36, region: 'Texas',           seed: 16 },
  { key: 'FF4_SOU_SAM',  topTeamId: 52, bottomTeamId: 53, region: 'South Carolina',  seed: 16 },
  { key: 'FF4_UVA_ASU',  topTeamId: 65, bottomTeamId: 66, region: 'South Carolina',  seed: 10 },
]

export function getFirstFourGame(region: Region, seed: number): FirstFourGame | null {
  return FIRST_FOUR.find(f => f.region === region && f.seed === seed) ?? null
}

// ── Win probability (historical NCAA women's tournament R1 rates) ────
// Source: seed-based historical win rates, top seed's % chance to win
const R1_WIN_PROB: Record<string, number> = {
  '1-16': 99, '2-15': 94, '3-14': 85, '4-13': 79,
  '5-12': 65, '6-11': 62, '7-10': 61, '8-9':  54,
}

// Returns top team's win probability (0–100) given their seeds.
// Works for any seed matchup — extrapolates if not in table.
export function getMatchupWinProb(topSeed: number, bottomSeed: number): number {
  const lo = Math.min(topSeed, bottomSeed)
  const hi = Math.max(topSeed, bottomSeed)
  const base = R1_WIN_PROB[`${lo}-${hi}`] ?? 50
  return topSeed <= bottomSeed ? base : 100 - base
}

// ── ESPN CDN logo IDs ─────────────────────────────────────────────────
// URL: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
// Maps our internal team id → ESPN school id
export const ESPNIDS: Partial<Record<number, number>> = {
  1:  41,   // UConn
  2:  2636, // UT San Antonio
  3:  66,   // Iowa State
  4:  183,  // Syracuse
  5:  120,  // Maryland
  6:  93,   // Murray State
  7:  153,  // North Carolina
  8:  2710, // Western Illinois
  9:  87,   // Notre Dame
  10: 2217, // Fairfield
  11: 194,  // Ohio State
  12: 47,   // Howard
  13: 356,  // Illinois
  14: 38,   // Colorado
  15: 238,  // Vanderbilt
  16: 2272, // High Point
  17: 26,   // UCLA
  18: 2856, // Cal Baptist
  19: 197,  // Oklahoma State
  20: 163,  // Princeton
  21: 145,  // Ole Miss
  22: 2250, // Gonzaga
  23: 135,  // Minnesota
  24: 2739, // Green Bay
  25: 239,  // Baylor
  26: 158,  // Nebraska
  27: 257,  // Richmond
  28: 150,  // Duke
  29: 232,  // Charleston
  30: 2641, // Texas Tech
  31: 222,  // Villanova
  32: 99,   // LSU
  33: 294,  // Jacksonville
  34: 251,  // Texas
  35: 2623, // Missouri State
  36: 2617, // Stephen F. Austin
  37: 2483, // Oregon
  38: 259,  // Virginia Tech
  39: 96,   // Kentucky
  40: 256,  // James Madison
  41: 277,  // West Virginia
  42: 193,  // Miami (OH)
  43: 333,  // Alabama
  44: 227,  // Rhode Island
  45: 97,   // Louisville
  46: 261,  // Vermont
  47: 152,  // NC State
  48: 2633, // Tennessee
  49: 130,  // Michigan
  50: 107,  // Holy Cross
  51: 2579, // South Carolina
  52: 2582, // Southern University
  53: 2535, // Samford
  54: 228,  // Clemson
  55: 30,   // USC
  56: 127,  // Michigan State
  57: 36,   // Colorado State
  58: 201,  // Oklahoma
  59: 70,   // Idaho
  60: 264,  // Washington
  61: 2571, // South Dakota State
  62: 2628, // TCU
  63: 28,   // UC San Diego
  64: 61,   // Georgia
  65: 258,  // Virginia
  66: 9,    // Arizona State
  67: 2294, // Iowa
  68: 161,  // Fairleigh Dickinson
}
