import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-Side Gemini AI Client Configuration
 * 
 * SECURITY MANDATES:
 * 1. Read strictly from process.env.GEMINI_API_KEY injected at runtime by Cloud Run from Secret Manager.
 * 2. NO fallback with hardcoded credentials in source code.
 * 3. Never exposed or transmitted to the client application.
 */

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key-here') {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Ensure it is injected via Google Secret Manager in Cloud Run.');
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Returns a configured Generative Model instance
 * @param {string} modelName - Model name (default: 'gemini-1.5-flash')
 * @param {string|object} systemInstruction - Optional system instruction
 */
export function getGeminiModel(modelName = 'gemini-1.5-flash', systemInstruction = null) {
  const genAI = getGeminiClient();

  const options = { model: modelName };
  if (systemInstruction) {
    options.systemInstruction = systemInstruction;
  }

  return genAI.getGenerativeModel(options);
}
