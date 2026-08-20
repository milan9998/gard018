export function calculateFullScreenQrSize(
  viewportWidth: number,
  viewportHeight: number,
) {
  const availableSize = Math.floor(
    Math.min(viewportWidth - 24, viewportHeight - 104, 520),
  )
  return Math.max(160, availableSize)
}
