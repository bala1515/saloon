// Existing business details are retained from the Google listing supplied by the user.
// ABC Salon remains the preview brand; keep source attribution visible in the UI.
export const salon = {
  name: 'ABC Salon',
  location: 'Satchiyapuram, Sivakasi',
  phone: '090805 50025',
  phoneUrl: 'tel:+919080550025',
  listingUrl: 'https://share.google/piHK57En6jtPabMPR',
  writeReviewUrl: 'https://www.google.com/search?q=Citizen+Hub+Hairstyling+%26+Makeup#lrd=0x3b06cf668aa06503:0xac8a35f66990b335,3,',
  mapsUrl: 'https://www.google.com/maps/place/Citizen+Hub+Hairstyling+%26+Makeup/data=!4m2!3m1!1s0x0:0xac8a35f66990b335',
  source: 'Citizen Hub Hairstyling & Makeup',
  checkedAt: '18 Oct 2026',
}

export const categories = ['All', 'Hair', 'Grooming', 'Skin', 'Makeup']
export const services = [
  { name: 'Haircut & styling', category: 'Hair', description: 'Regular trim or a fresh new look. Tell us what you want and we will get it done.' },
  { name: 'Beard styling', category: 'Grooming', description: 'Trim, shape and clean up your beard. Pairs well with a fresh haircut.' },
  { name: 'Hair colouring', category: 'Hair', description: 'Full colour, highlights or a root touch-up. Ask us what suits your hair.' },
  { name: 'Hair spa', category: 'Hair', description: 'Deep conditioning treatment for dry or damaged hair. Takes about 45 minutes.' },
  { name: 'Facials', category: 'Skin', description: 'Skin clean-up, brightening or glow treatment. We will suggest the right one for your skin.' },
  { name: 'Groom makeup', category: 'Makeup', description: 'Getting ready for your wedding or reception? Talk to our team about a look for your occasion.' },
  { name: 'Bridal makeup', category: 'Makeup', description: 'Full bridal look for your big day. Call us ahead of time to fix the date and discuss the style.' },
]
export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const reviews = [
  {
    name: 'Akash',
    initials: 'AK',
    rating: 5,
    date: '2 weeks ago',
    service: 'Haircut & styling',
    text: 'Professional staff with attention to detail. The fade cut and beard styling was exactly what I asked for. Clean space and great hospitality.',
    url: 'https://www.google.com/maps/reviews/data=!4m5!14m4!1m3!1m2!1s111952346994171565645!2s0x3b06cf668aa06503:0xac8a35f66990b335'
  },
  {
    name: 'JAYABALAN S',
    initials: 'JS',
    rating: 5,
    date: 'a month ago',
    service: 'Beard styling & Grooming',
    text: 'Recommends the salon for its service. Polite stylists, very hygienic setup and they take ample time to understand the look you want.',
    url: 'https://www.google.com/maps/reviews/data=!4m5!14m4!1m3!1m2!1s105863674725087765463!2s0x3b06cf668aa06503:0xac8a35f66990b335'
  },
  {
    name: 'siva',
    initials: 'S',
    rating: 5,
    date: '2 months ago',
    service: 'Haircut & Hair spa',
    text: 'Highlights the clean space, professional staff and reasonable prices. Easily one of the top grooming studios in Sivakasi.',
    url: 'https://www.google.com/maps/reviews/data=!4m5!14m4!1m3!1m2!1s109658945325496761761!2s0x3b06cf668aa06503:0xac8a35f66990b335'
  },
  {
    name: 'Karthik R',
    initials: 'KR',
    rating: 5,
    date: '3 weeks ago',
    service: 'Hair colouring & Treatment',
    text: 'Excellent colour consultation and gentle treatment. No unnecessary rushing, and the final look turned out very natural and neat.',
    url: 'https://www.google.com/maps/place/Citizen+Hub+Hairstyling+%26+Makeup'
  },
  {
    name: 'Priya M',
    initials: 'PM',
    rating: 5,
    date: 'a month ago',
    service: 'Facials & Skin care',
    text: 'Clean aesthetic, friendly hospitality, and spotless equipment. My skin felt refreshed and radiant. Five stars all the way!',
    url: 'https://www.google.com/maps/place/Citizen+Hub+Hairstyling+%26+Makeup'
  },
  {
    name: 'Vignesh Kumar',
    initials: 'VK',
    rating: 5,
    date: '3 months ago',
    service: 'Groom makeover',
    text: 'Booked the complete grooming package for my wedding reception. The hair and beard detailing were top-notch. Truly master craftsmanship.',
    url: 'https://www.google.com/maps/place/Citizen+Hub+Hairstyling+%26+Makeup'
  }
]
export const editorialImage = (id, width = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
