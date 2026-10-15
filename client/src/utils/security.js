// Validate a redirect target to prevent open redirect attacks.
// Only same origin relative paths are allowed.
export function isSafeRedirect(url) {
  if (!url || typeof url !== 'string') return false
  return url.startsWith('/') && !url.startsWith('//')
}
