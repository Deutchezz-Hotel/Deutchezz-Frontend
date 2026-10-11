/**
 * Validated runtime environment.
 *
 * Importing this module validates the build-time env and throws if a required
 * variable is missing, so misconfiguration fails fast at startup instead of
 * silently falling back to a default.
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid absolute URL'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL,
} as const;
