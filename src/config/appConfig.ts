/**
 * Static application configuration.
 *
 * These values are editable placeholders. The hotel name, address, contact
 * details and operational timings are consumed by the public site, the
 * dashboards and the mock backend so there is a single source of truth.
 */
export const appConfig = {
  hotelName: 'Deutchezz Hotel Ispahan',
  addressLines: ['Ahmadu Bello Way', 'Jos, Plateau State', 'Nigeria'],
  /** Placeholder phone number — replace with the real line. */
  phoneNumber: '+234 XXX XXX XXXX',
  /** Placeholder contact email — replace with the real inbox. */
  email: 'info@deutchezzhotel.com',
  currency: 'NGN',
  locale: 'en-NG',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  maxRoomsPerBooking: 20,
  /** Logo asset served from /public. */
  logoUrl: '/images/logoh.png',
} as const;

export type AppConfig = typeof appConfig;
