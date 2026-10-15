// Paste full photo URLs from Unsplash or Pexels between the quotes.
// Leave a slot empty to show the gray block.
const PHOTOS = {
  hero: 'https://images.pexels.com/photos/8486934/pexels-photo-8486934.jpeg',
  about: 'https://images.pexels.com/photos/34526423/pexels-photo-34526423.jpeg',
  work: ['https://images.pexels.com/photos/10202856/pexels-photo-10202856.jpeg', 'https://images.pexels.com/photos/29181490/pexels-photo-29181490.jpeg', 'https://images.pexels.com/photos/8853499/pexels-photo-8853499.jpeg', 'https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg'],
  services: ['https://images.pexels.com/photos/5965544/pexels-photo-5965544.jpeg', 'https://images.pexels.com/photos/6614757/pexels-photo-6614757.jpeg', 'https://images.pexels.com/photos/8284725/pexels-photo-8284725.jpeg', 'https://images.pexels.com/photos/38728964/pexels-photo-38728964.jpeg'],
  why: 'https://images.pexels.com/photos/33320793/pexels-photo-33320793.jpeg',
  cta: 'https://images.pexels.com/photos/12059822/pexels-photo-12059822.jpeg',
  blog: ['https://images.pexels.com/photos/8199652/pexels-photo-8199652.jpeg', 'https://images.pexels.com/photos/33920051/pexels-photo-33920051.jpeg', 'https://images.pexels.com/photos/5965581/pexels-photo-5965581.jpeg'],
}

function sized(url, w, h) {
  if (!url) return null
  if (url.startsWith('/')) return url
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

// Testimonial photos stay empty on purpose. Add them only for real quotes from real people.
const IMAGES = {
  hero: sized(PHOTOS.hero, 1200, 1400),
  about: sized(PHOTOS.about, 1000, 1000),
  work: PHOTOS.work.map((u) => sized(u, 1200, 800)),
  services: PHOTOS.services.map((u) => sized(u, 700, 440)),
  why: sized(PHOTOS.why, 1200, 1100),
  cta: sized(PHOTOS.cta, 2000, 1000),
  testimonials: [null, null, null, null],
  blog: [
    sized(PHOTOS.blog[0], 800, 800),
    sized(PHOTOS.blog[1], 800, 533),
    sized(PHOTOS.blog[2], 800, 533),
  ],
}

export default IMAGES
