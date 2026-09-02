import dotenv from 'dotenv';
import { z } from 'zod';

// Load local .env if present (in development)
dotenv.config();

// Schema for required environment variables
const envSchema = z.object({
  PORT: z.string().default('8080').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GCP_PROJECT_ID: z.string().optional().default(process.env.GOOGLE_CLOUD_PROJECT || 'local-gcp-project'),
  GEMINI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default('100').transform((val) => parseInt(val, 10)),
});

// Safe parsing
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ FATAL: Environment variable validation failed:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

export const env = parseResult.data;

// Security audit warning if Gemini API key is missing
if (!env.GEMINI_API_KEY && env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set. Ensure it is mapped from Google Secret Manager.');
}
