/**
 * Services factory. VITE_USE_MOCKS toggles between real (fetch) and mock
 * (in-memory + localStorage). Consumers import `services` and never touch the
 * implementation directly.
 */
import type { ServiceCollection } from './services/interfaces';
import { realServices } from './services/real';
import { mockServices } from './services/mock';

export const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export const services: ServiceCollection = useMocks ? mockServices : realServices;

export * from './services/interfaces';
export * from './problem';
export * from './auth-storage';