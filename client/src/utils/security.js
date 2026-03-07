/**
 * Security utilities for Nexlynk frontend.
 *
 * Token strategy:
 *   - accessToken  → sessionStorage only (cleared on tab close, never localStorage)
 *   - refreshToken → httpOnly cookie managed by backend (we never touch it in JS)
 *
 * This makes XSS unable to steal the refresh token and limits access token
 * exposure to the current session.
 */

const ACCESS_TOKEN_KEY = '__nx_at'

// this are the access Token storage utilities. We use sessionStorage to store the access token, which means it will be cleared when the tab is closed. The refresh token is stored in an httpOnly cookie, which is not accessible via JavaScript, providing an additional layer of security against XSS attacks. 
export const tokenStorage = {
  get:    ()     => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  set:    (t)    => sessionStorage.setItem(ACCESS_TOKEN_KEY, t),
  remove: ()     => sessionStorage.removeItem(ACCESS_TOKEN_KEY),
}

// Input Sanitization
/**
 * Strip HTML tags from user-supplied strings before rendering
 * to prevent stored-XSS when content is injected into the DOM.
 * Use this for any user-supplied string rendered via dangerouslySetInnerHTML.
 * For everything else, React's JSX escapes automatically — no need.
 */
export function sanitizeHTML(dirty) {
  if (typeof window === 'undefined') return ''
  // Dynamic import to avoid loading DOMPurify on every module load
  // In practice, import at top of the file that uses it.
  const div = document.createElement('div')
  div.textContent = dirty        // textContent assignment auto-escapes
  return div.innerHTML           // now safe to use as HTML
}

// URL Param Sanitization 
/** Encode path segments that come from user input (e.g. cv_path for signed URLs) */
export function encodePathParam(raw) {
  return encodeURIComponent(raw)
}

// Redirect Guard 
/**
 * Validate a redirect target to prevent open-redirect attacks.
 * Only allow same-origin relative paths.
 */
export function isSafeRedirect(url) {
  if (!url || typeof url !== 'string') return false
  // Must start with / and NOT contain // (protocol-relative)
  return url.startsWith('/') && !url.startsWith('//')
}

//  Rate-limit aware retry helper for API calls that may hit 429 Too Many Requests. Use with an exponential backoff strategy.
export function backoffDelay(attempt) {
  return Math.min(1000 * 2 ** attempt, 30_000)
}