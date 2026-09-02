import { getGeminiModel } from '../config/gemini.js';

/**
 * Server-Side Gemini Service for MindScribe AI Journal
 * 
 * SECURITY:
 * All calls are executed strictly on the server.
 * Gemini API Key is never transmitted across the network to client applications.
 */

const DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION = `You are MindScribe AI, an empathetic, supportive, and psychologically-grounded journaling assistant.
Your role is to help users reflect on their thoughts, organize feelings, overcome writer's block, and ask insightful questions.
When answering:
- Maintain an encouraging, warm, non-judgmental, and introspective tone.
- When helping structure an entry, suggest clear headings, bullet points, or reflection prompts.
- Avoid generic platitudes; offer deep, tailored insights.
- Format responses cleanly with markdown.`;

export const geminiService = {
  /**
   * General-purpose chat/journal-assistant generation
   * @param {string} prompt - User message / prompt
   * @param {Array} history - Array of { role: 'user' | 'model', text: string }
   * @param {string} systemInstruction - Optional custom system instruction
   */
  async generateChatResponse(prompt, history = [], systemInstruction = null) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty.');
    }

    try {
      const instruction = systemInstruction || DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION;
      const model = getGeminiModel('gemini-1.5-flash', instruction);

      // Format history for Gemini SDK if provided
      const formattedHistory = Array.isArray(history)
        ? history
            .filter((msg) => msg && msg.text && (msg.role === 'user' || msg.role === 'model' || msg.role === 'assistant'))
            .map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : msg.role,
              parts: [{ text: msg.text }],
            }))
        : [];

      // Start multi-turn chat session with history
      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const result = await chat.sendMessage(prompt.trim());
      const response = await result.response;
      const responseText = response.text();

      return {
        text: responseText,
        model: 'gemini-1.5-flash',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Local development fallback if API key is not configured yet
      if (
        (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API_KEY_INVALID')) &&
        process.env.NODE_ENV !== 'production'
      ) {
        console.warn('⚡ Using local dev assistant response (GEMINI_API_KEY not set locally)');
        return {
          text: `Thank you for sharing. It sounds like you're exploring your thoughts today. Here is a reflection framework to help you process:\n\n1. **Acknowledge the Emotion**: Give yourself permission to express what is on your mind.\n2. **Identify What's in Your Control**: What is one small thing you can focus on right now?\n3. **Tomorrow's Fresh Start**: How would you like to build upon this experience?\n\n*(Note: Add your GEMINI_API_KEY to Secret Manager on Cloud Run or your local .env to enable live Gemini 1.5 models).*`,
          model: 'dev-mode-assistant',
          timestamp: new Date().toISOString(),
        };
      }

      console.error('❌ Gemini Chat Error:', error);
      throw error;
    }
  },

  /**
   * Analyze a journal entry and generate an emotional & reflective breakdown
   */
  async generateReflection(content, mood = 'Reflective') {
    const safeContent = (content || '').trim() || 'A brief reflection of the day.';

    try {
      const model = getGeminiModel('gemini-1.5-flash', DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION);

      const prompt = `Analyze this journal entry:
Mood declared by user: ${mood}

Entry Content:
"""
${safeContent}
"""

Please provide a structured JSON response with the following keys:
1. "summary": A concise 2-sentence empathetic summary of what was shared.
2. "sentimentAnalysis": An assessment of underlying emotional currents (e.g. Hopeful, Exhausted, Ambitious, Overwhelmed, Lighthearted).
3. "keyThemes": An array of 2 to 4 recurring themes identified in this entry.
4. "growthInsight": An encouraging, constructive perspective or actionable takeaway.
5. "deepQuestions": An array of 2 thoughtful questions to help the user explore this further tomorrow.

Ensure your entire output is valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      // Local development fallback if API key is not configured or in dev mode
      if (
        (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API_KEY_INVALID') || error.message?.includes('fetch failed')) &&
        process.env.NODE_ENV !== 'production'
      ) {
        console.warn('⚡ Using local dev reflection insight (GEMINI_API_KEY not set locally)');
        return {
          summary: `You captured a candid, raw moment today reflecting your mood and current state of mind.`,
          sentimentAnalysis: `${mood || 'Expressive'}, Authentic, Spontaneous`,
          keyThemes: ['Daily Impressions', 'Authenticity', 'Mindfulness'],
          growthInsight: `Even short thoughts are valuable records of your emotional arc. Honoring whatever comes up without judgment is the foundation of self-awareness.`,
          deepQuestions: [
            `What is behind this feeling that you'd like to explore more deeply tomorrow?`,
            `What is one thing that made you smile or pause today?`,
          ],
        };
      }

      console.error('❌ Gemini Reflection Error:', error);
      throw new Error(`Failed to generate AI reflection: ${error.message}`);
    }
  },

  /**
   * Generate personalized journaling prompts based on recent entries or moods
   */
  async generateDailyPrompts(recentMoods = [], topics = []) {
    try {
      const model = getGeminiModel('gemini-1.5-flash', DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION);

      const prompt = `Generate 4 inspiring, thought-provoking daily journaling prompts.
Recent moods: ${recentMoods.join(', ') || 'Mixed'}
Topics of interest: ${topics.join(', ') || 'Personal Growth, Mindfulness, Career, Well-being'}

Return a JSON array of prompt objects with keys:
- "title": A short catchy label (e.g. "Gratitude Anchor", "Clarity Check")
- "prompt": The full journaling question / prompt
- "category": (e.g. "Mindfulness", "Productivity", "Emotional Awareness", "Vision")
`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      return JSON.parse(result.response.text());
    } catch (error) {
      if (
        (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API_KEY_INVALID') || error.message?.includes('fetch failed')) &&
        process.env.NODE_ENV !== 'production'
      ) {
        return [
          {
            title: 'Reclaiming Your Calm',
            prompt: 'What was the single most notable event today, and how can you release tension around it right now?',
            category: 'Emotional Awareness',
          },
          {
            title: 'Daily Anchor',
            prompt: 'Name three small things that brought you comfort or warmth today.',
            category: 'Mindfulness',
          },
          {
            title: 'Tomorrow’s Vision',
            prompt: 'What is one intention or boundary you want to hold firmly tomorrow?',
            category: 'Productivity',
          },
          {
            title: 'Self-Compassion Check',
            prompt: 'What encouraging words would you offer a close friend who had the exact same day you did?',
            category: 'Personal Growth',
          },
        ];
      }

      console.error('❌ Gemini Prompts Generation Error:', error);
      throw new Error(`Failed to generate daily prompts: ${error.message}`);
    }
  },
};
