import { appConfig, type HotelMapConfig } from '@/config/appConfig';

/**
 * Google Maps link helpers. No API key, no SDK �?" plain links and an embed URL.
 *
 * Each helper resolves in three fallback levels:
 *   1. an explicit configured URL (`embedUrl` / `placeUrl`), else
 *   2. exact coordinates (`latitude` / `longitude`), else
 *   3. a text address search for the hotel.
 *
 * The optional `config` argument defaults to `appConfig.map` and exists so the
 * fallback levels can be unit-tested without mutating the app config.
 */

/** "Deutchezz Hotel Ispahan, Ahmadu Bello Way, Jos, Plateau State, Nigeria". */
export function fullAddress(): string {
  const { street, city, state, country } = appConfig.address;
  return [appConfig.hotelName, street, city, state, country].join(', ');
}

/** "lat,lng" when both coordinates are configured, otherwise null. */
function coordinatePair(config: HotelMapConfig): string | null {
  const { latitude, longitude } = config;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude},${longitude}`;
  }
  return null;
}

export function getEmbedSrc(config: HotelMapConfig = appConfig.map): string {
  if (config.embedUrl) return config.embedUrl;
  const coords = coordinatePair(config);
  if (coords) return `https://www.google.com/maps?q=${coords}&z=17&output=embed`;
  return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress())}&z=16&output=embed`;
}

export function getOpenUrl(config: HotelMapConfig = appConfig.map): string {
  if (config.placeUrl) return config.placeUrl;
  const coords = coordinatePair(config);
  if (coords) return `https://www.google.com/maps/search/?api=1&query=${coords}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress())}`;
}

export function getDirectionsUrl(config: HotelMapConfig = appConfig.map): string {
  const coords = coordinatePair(config);
  return `https://www.google.com/maps/dir/?api=1&destination=${coords ?? encodeURIComponent(fullAddress())}`;
}
