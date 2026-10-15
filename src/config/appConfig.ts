/**
 * Static application configuration.
 *
 * These values are editable placeholders. The hotel name, address, contact
 * details and operational timings are consumed by the public site, the
 * dashboards and the mock backend so there is a single source of truth.
 */
/** Structured hotel address. `addressLines` below is derived from this. */
const hotelAddress = {
  street: 'Ahmadu Bello Way',
  city: 'Jos',
  state: 'Plateau State',
  country: 'Nigeria',
} as const;

/**
 * Google Maps configuration for the Contact page. `embedUrl` is the single
 * place the hotel's embed URL lives; leave it empty to fall back to a
 * key-less address-search embed (see `src/lib/maps.ts`).
 */
export interface HotelMapConfig {
  /** Full Google Maps embed URL. Preferred; empty falls back to a search embed. */
  embedUrl: string;
  /** Public place link for "Open in Google Maps". Preferred; empty falls back to a search link. */
  placeUrl: string;
  /** Exact coordinates, used when no URL is configured. */
  latitude: number | null;
  longitude: number | null;
}

/** The single source of the hotel's map links and embed URL. */
export const hotelMapConfig: HotelMapConfig = {
  embedUrl: '',
  placeUrl: '',
  latitude: null,
  longitude: null,
};

export const appConfig = {
  hotelName: 'Deutchezz Hotel Ispahan',
  address: hotelAddress,
  addressLines: [hotelAddress.street, `${hotelAddress.city}, ${hotelAddress.state}`, hotelAddress.country],
  /** Placeholder phone number �?" replace with the real line. */
  phoneNumber: '+234 XXX XXX XXXX',
  /** Placeholder contact email �?" replace with the real inbox. */
  email: 'info@deutchezzhotel.com',
  currency: 'NGN',
  locale: 'en-NG',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  maxRoomsPerBooking: 20,
  /** Logo asset served from /public. */
  logoUrl: '/images/logoh.png',
  map: hotelMapConfig,
} as const;

export type AppConfig = typeof appConfig;
