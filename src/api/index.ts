/**
 * Services factory. Consumers import `services` and never touch the
 * implementation directly. The app always talks to the real backend API.
 */
import type { ServiceCollection } from './services/interfaces';
import { realServices } from './services/real';

export const services: ServiceCollection = realServices;

export * from './services/interfaces';
export * from './problem';
export * from './auth-storage';
