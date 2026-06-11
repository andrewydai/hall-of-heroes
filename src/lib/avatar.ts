export function resolveAvatar(avatarUrl: string | null): string {
  if (!avatarUrl) return '/avatars/unknown_player.png'
  if (avatarUrl.includes('/')) return avatarUrl
  return `/avatars/${avatarUrl}.png`
}

export function resolveGameImage(iconPath: string | null): string {
  if (!iconPath) return '/games/unknown_game.png'
  if (iconPath.includes('/')) return iconPath
  return `/games/${iconPath}.png`
}
