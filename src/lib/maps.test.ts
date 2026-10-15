import { describe, expect, it } from 'vitest';
import type { HotelMapConfig } from '@/config/appConfig';
import { fullAddress, getDirectionsUrl, getEmbedSrc, getOpenUrl } from './maps';

const base: HotelMapConfig = {
  embedUrl: '',
  placeUrl: '',
  latitude: null,
  longitude: null,
};

const encodedAddress = encodeURIComponent(fullAddress());

describe('fullAddress', () => {
  it('composes the hotel name with the full street address', () => {
    expect(fullAddress()).toBe(
      'Deutchezz Hotel Ispahan, Ahmadu Bello Way, Jos, Plateau State, Nigeria',
    );
  });
});

describe('getEmbedSrc', () => {
  it('level 1 �?" uses the configured embed URL verbatim', () => {
    expect(getEmbedSrc({ ...base, embedUrl: 'https://www.google.com/maps/embed?pb=custom' })).toBe(
      'https://www.google.com/maps/embed?pb=custom',
    );
  });

  it('level 2 �?" uses exact coordinates when set', () => {
    expect(getEmbedSrc({ ...base, latitude: 9.8965, longitude: 8.8583 })).toBe(
      'https://www.google.com/maps?q=9.8965,8.8583&z=17&output=embed',
    );
  });

  it('level 3 �?" falls back to an address search', () => {
    expect(getEmbedSrc(base)).toBe(
      `https://www.google.com/maps?q=${encodedAddress}&z=16&output=embed`,
    );
  });
});

describe('getOpenUrl', () => {
  it('level 1 �?" uses the configured place URL verbatim', () => {
    expect(getOpenUrl({ ...base, placeUrl: 'https://maps.app.goo.gl/custom' })).toBe(
      'https://maps.app.goo.gl/custom',
    );
  });

  it('level 2 �?" uses exact coordinates when set', () => {
    expect(getOpenUrl({ ...base, latitude: 9.8965, longitude: 8.8583 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=9.8965,8.8583',
    );
  });

  it('level 3 �?" falls back to an address search', () => {
    expect(getOpenUrl(base)).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    );
  });
});

describe('getDirectionsUrl', () => {
  it('level 2 �?" uses exact coordinates when set', () => {
    expect(getDirectionsUrl({ ...base, latitude: 9.8965, longitude: 8.8583 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=9.8965,8.8583',
    );
  });

  it('level 3 �?" falls back to the address', () => {
    expect(getDirectionsUrl(base)).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    );
  });
});
