// Paste full photo URLs from Unsplash or Pexels between the quotes.
// Leave empty to fall back to a flat navy panel.
const PHOTOS = {
  login:    'https://images.pexels.com/photos/16494364/pexels-photo-16494364.jpeg',
  register: 'https://images.pexels.com/photos/36101264/pexels-photo-36101264.jpeg',
}

function sized(url, w, h) {
  if (!url) return null
  let u
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  if (u.hostname === 'images.unsplash.com') {
    u.search = ''
    u.searchParams.set('auto', 'format')
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('w', String(w))
    u.searchParams.set('h', String(h))
    u.searchParams.set('q', '80')
  } else if (u.hostname === 'images.pexels.com') {
    u.search = ''
    u.searchParams.set('auto', 'compress')
    u.searchParams.set('cs', 'tinysrgb')
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('w', String(w))
    u.searchParams.set('h', String(h))
  }
  return u.toString()
}

const AUTH_IMAGES = {
  login:    sized(PHOTOS.login, 900, 1400),
  register: sized(PHOTOS.register, 900, 1400),
}

export default AUTH_IMAGES
