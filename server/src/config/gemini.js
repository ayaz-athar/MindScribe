import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-Side Gemini AI Client Configuration
 * 
 * SECURITY MANDATES:
 * 1. Read strictly from process.env.GEMINI_API_KEY injected at runtime.
 * 2. NO fallback with hardcoded credentials in source code.
 * 3. Never exposed or transmitted to the client application.
 */

export const SUPPORTED_GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.5-pro',
].filter(Boolean);

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key-here') {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Ensure it is added in your Vercel or Cloud Run environment variables.');
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Returns a configured Generative Model instance
 * @param {string} modelName - Model name
 * @param {string|object} systemInstruction - Optional system instruction
 */
export function getGeminiModel(modelName = 'gemini-2.5-flash', systemInstruction = null) {
  const genAI = getGeminiClient();

  const options = { model: modelName };
  if (systemInstruction) {
    options.systemInstruction = systemInstruction;
  }

  return genAI.getGenerativeModel(options);
}
