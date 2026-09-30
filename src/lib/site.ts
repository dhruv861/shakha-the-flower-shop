// Every business fact on the site lives here, so updates happen in one place.
//
// Placeholders in [BRACKETS] are facts Shakha still has to confirm before
// launch (see README → "Before launch"). They render as-is on purpose:
// never replace one with a guess.

export const PLACEHOLDER = {
  price: "[PRICE]",
  cutoffTime: "[CUTOFF TIME]",
} as const;

export const site = {
  name: "Shakha The Flower Shop",
  url: "https://shakhatheflowershop.com",
  city: "Surat",
  since: 2014,
  tagline: "Not just flowers. Emotions, wrapped beautifully.",
  description:
    "Hand-tied bouquets, creative gift bouquets and luxury hampers from Shakha's studios in Vesu and Dumas, Surat — made to order and delivered the same day. Order on WhatsApp.",
  email: "shakha.flower@gmail.com",
  whatsappNumber: "917046022020",
  phone: { display: "+91 70460 22020", href: "tel:+917046022020" },
  instagram: {
    handle: "shakhaflowerofficial",
    url: "https://www.instagram.com/shakhaflowerofficial/",
  },
  sameDayCutoff: PLACEHOLDER.cutoffTime,
  // "From ₹…" starting prices. The three signature creations are priced
  // individually on their cards; `signature` is the band's overall figure.
  prices: {
    bouquets: PLACEHOLDER.price,
    signature: PLACEHOLDER.price,
    hampers: PLACEHOLDER.price,
    litchiBouquet: PLACEHOLDER.price,
    coffeeBouquet: PLACEHOLDER.price,
    teddyGiftBag: PLACEHOLDER.price,
  },
} as const;

export type Branch = {
  id: string;
  name: string;
  badge?: string;
  streetAddress: string;
  postalCode: string;
  addressLine: string;
  hours: string;
  shortHours: string;
  shortName: string;
  opens: string;
  closes: string;
  phone: { display: string; href: string };
  geo: { lat: number; lng: number };
  mapsUrl: string;
};

export const branches: Branch[] = [
  {
    id: "vesu",
    name: "Vesu",
    shortName: "Vesu",
    badge: "Flagship · Since 2014",
    streetAddress:
      "Shop No 1, Money Arcade, Vesu Canal Rd, beside HDFC Bank, near G.D. Goenka School",
    postalCode: "395097",
    addressLine:
      "Shop No 1, Money Arcade, Vesu Canal Rd, beside HDFC Bank, near G.D. Goenka School, Surat 395097",
    hours: "Open daily, 8 AM – 10 PM",
    shortHours: "8 AM – 10 PM",
    opens: "08:00",
    closes: "22:00",
    phone: site.phone,
    geo: { lat: 21.150117, lng: 72.7890523 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=SHAKHA%20The%20Flower%20Shop&query_place_id=ChIJgdNbzm9S4DsR2DC6BNAky74",
  },
  {
    id: "dumas",
    name: "Dumas · Airport Road",
    shortName: "Dumas",
    streetAddress: "74 Silent Zone, beside Ghar Restaurant, near Surat Airport",
    postalCode: "394550",
    addressLine: "74 Silent Zone, beside Ghar Restaurant, near Surat Airport, Surat 394550",
    hours: "Open daily, 8:30 AM – 10:30 PM",
    shortHours: "8:30 AM – 10:30 PM",
    opens: "08:30",
    closes: "22:30",
    phone: { display: "+91 75748 92611", href: "tel:+917574892611" },
    geo: { lat: 21.1233232, lng: 72.7278889 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Shakha%20the%20flower%20shop&query_place_id=ChIJrWO89WBT4DsRFJkoYaKL5rM",
  },
];

/** A wa.me link that opens WhatsApp with `message` already typed. */
export function whatsappLink(message = "Hi Shakha! I'd like to order flowers.") {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Google rating shown in the reviews section (from the Vesu listing).
export const googleReviews = {
  fiveStar: 84,
  total: 143,
  average: 4.1,
  listingUrl: branches[0].mapsUrl,
} as const;
