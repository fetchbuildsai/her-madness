import { ROUND_POINTS } from './data'

// Calculate a user's score given their picks and actual tournament results.
// Both maps use the same pick key format (e.g. "R0_1_0", "FF_0", "CHAMP")
export function calculateScore(
  userPicks: Record<string, number>,
  results:   Record<string, number>
): number {
  let total = 0
  for (const [key, teamId] of Object.entries(userPicks)) {
    if (teamId && results[key] === teamId) {
      total += pointsForKey(key)
    }
  }
  return total
}

export function pointsForKey(key: string): number {
  if (key === 'CHAMP')        return ROUND_POINTS[6]   // 320
  if (key.startsWith('FF_'))  return ROUND_POINTS[5]   // 160 — Final Four semis
  if (key.startsWith('FF4_')) return 0                 // First Four unscored
  const round = parseInt(key.split('_')[1] ?? '0')
  return ROUND_POINTS[round] ?? 0
}

// Maximum achievable score (pick every game correctly):
// 32 × 10 + 16 × 20 + 8 × 40 + 4 × 80 + 2 × 160 + 1 × 320 = 1920
export const MAX_SCORE = 1920
