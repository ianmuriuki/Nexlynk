// src/components/shared/NexlynkLogo.jsx
// Central logo component — update images here and it propagates everywhere

/**
 * variant="full"  → full company logo (icon2.jpeg) — used in navbars, auth pages
 * variant="icon"  → small square icon (icon1.jpeg) — used in mobile topbar, small contexts
 * variant="white" → full logo with white filter for dark backgrounds
 */
export default function NexlynkLogo({ variant = 'full', className = '' }) {
  if (variant === 'icon') {
    return (
      <img
        src="/icons/icon1.jpeg"
        alt="Nexlynk"
        className={`h-8 w-8 rounded-lg object-cover ${className}`}
      />
    )
  }

  if (variant === 'white') {
    return (
      <img
        src="/icons/icon2.jpeg"
        alt="Nexlynk"
        className={`h-9 object-contain ${className}`}
      />
    )
  }

  // default: 'full'
  return (
    <img
      src="/icons/icon2.jpeg"
      alt="Nexlynk"
      className={`h-9 object-contain ${className}`}
    />
  )
}