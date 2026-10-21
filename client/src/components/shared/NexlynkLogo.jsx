// src/components/shared/NexlynkLogo.jsx
// Central logo component — update images here and it propagates everywhere

/**
 * variant="full"  → full company logo (icon2.png) — used in navbars, auth pages
 * variant="icon"  → circular logo (nexlynk-lg.jpeg) — used in mobile topbar, small contexts
 * variant="white" → full logo with white filter for dark backgrounds
 */
export default function NexlynkLogo({ variant = 'full', className = '' }) {
  if (variant === 'icon') {
    return (
      <span
        role="img"
        aria-label="Nexlynk"
        className={`grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-brand/20 bg-white p-1 shadow-soft ${className}`}
      >
        <img
          src="/icons/nexlynk-lg.jpeg"
          alt=""
          className="h-full w-full rounded-full object-contain"
        />
      </span>
    )
  }

  if (variant === 'white') {
    return (
      <img
        src="/icons/icon2.png"
        alt="Nexlynk"
        className={`h-9 object-contain ${className}`}
      />
    )
  }

  // default: 'full'
  return (
    <img
      src="/icons/icon2.png"
      alt="Nexlynk"
      className={`h-9 object-contain ${className}`}
    />
  )
}