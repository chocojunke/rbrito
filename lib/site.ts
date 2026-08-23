export const site = {
  name: 'RBrito Studio',
  // Substitua pelo seu link real de marcações (ex.: Treatwell, Fresha, etc.)
  bookingUrl: '/marcacao',
  phone: '+351 912 345 678',
  phoneHref: 'tel:+351912345678',
  email: 'ola@rbritostudio.pt',
  emailHref: 'mailto:ola@rbritostudio.pt',
  instagram: '@rbrito.studio',
  instagramUrl: 'https://instagram.com',
  address: {
    line1: 'Rua dos Barbeiros, 12',
    line2: 'Leça da Palmeira, Portugal',
    query: 'Rua+dos+Barbeiros+12,+Leça+da+Palmeira,+Portugal',
  },
  // Link direto de partilha do Google Maps (botão "Abrir no Google Maps")
  mapsShareUrl: 'https://maps.app.goo.gl/ZtqdQZjmQkHnXopx8',
  hours: [
    { day: 'Segunda – Sexta', time: '09:00 – 20:00' },
    { day: 'Sábado', time: '09:00 – 19:00' },
    { day: 'Domingo', time: 'Encerrado' },
  ],
} as const

export const mapsEmbedUrl = `https://www.google.com/maps?q=${site.address.query}&z=17&output=embed`
export const mapsLinkUrl = site.mapsShareUrl
