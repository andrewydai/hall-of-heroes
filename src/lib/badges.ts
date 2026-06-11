import type { PlayerStats, PlayerBadge } from '../types'

export function computeBadges(stats: PlayerStats): PlayerBadge[] {
  const badges: PlayerBadge[] = []
  const { sessions, total_sessions, coop_wins, coop_losses } = stats

  // ── Rival: lost to one specific player 3+ times ──────────────────────────
  if (stats.rival) {
    const name = stats.rival.display_name ?? stats.rival.name
    badges.push({
      id: 'rival',
      label: `⚔️ ${name}'s Rival`,
      tooltip: `You've lost to ${name} ${stats.rival.loss_count} times — a personal nemesis.`,
    })
  }

  // ── Specialist: 40%+ of sessions in a single game ────────────────────────
  if (total_sessions > 0) {
    const gameCounts = new Map<string, { name: string; count: number }>()
    for (const s of sessions) {
      const entry = gameCounts.get(s.game_id) ?? { name: s.game_name, count: 0 }
      entry.count++
      gameCounts.set(s.game_id, entry)
    }
    const topGame = [...gameCounts.values()].sort((a, b) => b.count - a.count)[0]
    if (topGame && topGame.count / total_sessions >= 0.4) {
      const pct = Math.round((topGame.count / total_sessions) * 100)
      badges.push({
        id: 'specialist',
        label: `🎯 Specialist`,
        tooltip: `${pct}% of your sessions are ${topGame.name} — a creature of habit.`,
      })
    }
  }

  // ── Globetrotter: 7+ unique games played ─────────────────────────────────
  const uniqueGameCount = new Set(sessions.map(s => s.game_id)).size
  if (uniqueGameCount >= 7) {
    badges.push({
      id: 'globetrotter',
      label: `🗺️ Globetrotter`,
      tooltip: `${uniqueGameCount} different games played — no game left untried.`,
    })
  }

  // ── Socialite: played with every other registered player at least once ───
  if (stats.total_player_count > 1 && stats.unique_opponent_count >= stats.total_player_count - 1) {
    badges.push({
      id: 'socialite',
      label: `🐺 Socialite`,
      tooltip: `You've shared a table with all ${stats.unique_opponent_count} other adventurers.`,
    })
  }

  // ── Veteran: 15+ sessions ────────────────────────────────────────────────
  if (total_sessions >= 15) {
    badges.push({
      id: 'veteran',
      label: `🏅 Veteran`,
      tooltip: `${total_sessions} sessions played — a seasoned adventurer.`,
    })
  }

  // ── On Fire: currently on a 2+ game competitive win streak ───────────────
  // sessions are already sorted newest-first from the API
  const competitiveSessions = sessions.filter(s => s.game_type === 'competitive')
  let streak = 0
  for (const s of competitiveSessions) {
    if (s.is_winner === 1) streak++
    else break
  }
  if (streak >= 2) {
    badges.push({
      id: 'on-fire',
      label: `🔥 On Fire`,
      tooltip: `Current win streak: ${streak} competitive games in a row.`,
    })
  }

  // ── Cooperative Spirit: 60%+ co-op win rate with 3+ co-op sessions ───────
  const coopTotal = coop_wins + coop_losses
  if (coopTotal >= 3 && coop_wins / coopTotal >= 0.6) {
    const pct = Math.round((coop_wins / coopTotal) * 100)
    badges.push({
      id: 'coop-spirit',
      label: `🛡️ Co-op Spirit`,
      tooltip: `${pct}% co-op win rate across ${coopTotal} sessions — a true team player.`,
    })
  }

  // ── Ironclad: played every game in the library ───────────────────────────
  if (stats.total_game_count > 0 && uniqueGameCount >= stats.total_game_count) {
    badges.push({
      id: 'ironclad',
      label: `⚙️ Ironclad`,
      tooltip: `You've tried every game on the shelf — all ${stats.total_game_count}.`,
    })
  }

  return badges
}
