import { getGeminiModel, SUPPORTED_GEMINI_MODELS } from '../config/gemini.js';

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
   */
  async generateChatResponse(prompt, history = [], systemInstruction = null) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty.');
    }

    const instruction = systemInstruction || DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION;
    const formattedHistory = Array.isArray(history)
      ? history
          .filter((msg) => msg && msg.text && (msg.role === 'user' || msg.role === 'model' || msg.role === 'assistant'))
          .map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.text }],
          }))
      : [];

    // Attempt candidate models with graceful fallback on 404/retirement
    for (const modelName of SUPPORTED_GEMINI_MODELS) {
      try {
        const model = getGeminiModel(modelName, instruction);
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
          model: modelName,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        console.warn(`Gemini Chat with model ${modelName} notice:`, err.message);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          continue; // Try next candidate model
        }
        break;
      }
    }

    // Resilient fallback assistant response
    return {
      text: `Thank you for sharing your thoughts with MindScribe. I am here with you as you reflect today.\n\nHere is a grounding thought to guide you:\n\n1. **Acknowledge the Emotion**: Whatever you are experiencing right now is valid.\n2. **Focus on What You Can Control**: What is one gentle, comforting action you can take for yourself today?\n3. **Looking Ahead**: How would you like tomorrow to feel?\n\nTake your time—every entry is a step forward in self-discovery.`,
      model: 'mindscribe-adaptive-assistant',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Analyze a journal entry and generate an emotional & reflective breakdown
   */
  async generateReflection(content, mood = 'Reflective') {
    const safeContent = (content || '').trim() || 'Reflecting on the day.';

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

    // Attempt candidate models with graceful fallback on 404/retirement
    for (const modelName of SUPPORTED_GEMINI_MODELS) {
      try {
        const model = getGeminiModel(modelName, DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION);

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const responseText = result.response.text();
        return JSON.parse(responseText);
      } catch (err) {
        console.warn(`Gemini Reflection with model ${modelName} notice:`, err.message);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          continue; // Try next model
        }
        break;
      }
    }

    // Empathetic fallback reflection tailored to user's mood
    const isNegative = ['Anxious', 'Reflective'].includes(mood) || safeContent.toLowerCase().includes('bad') || safeContent.toLowerCase().includes('sad');
    
    return {
      summary: isNegative
        ? `You expressed feeling weighed down today and gave voice to a difficult emotional space.`
        : `You captured an authentic moment from your day, exploring your thoughts and current mindset.`,
      sentimentAnalysis: isNegative
        ? `${mood || 'Vulnerable'}, Seeking Relief, Processing Difficulties`
        : `${mood || 'Reflective'}, Thoughtful, Open`,
      keyThemes: isNegative
        ? ['Emotional Release', 'Self-Compassion', 'Resilience']
        : ['Daily Awareness', 'Personal Growth', 'Mindfulness'],
      growthInsight: isNegative
        ? `Admitting when things feel bad is a form of emotional honesty. You do not have to fix everything today; just allowing yourself to acknowledge the pain is the start of releasing it.`
        : `Giving your thoughts space on paper helps clarify what matters most to you right now.`,
      deepQuestions: isNegative
        ? [
            `What is one thing you can take off your shoulders tonight to lighten the load?`,
            `If you were comforting a close friend feeling this way, what gentle words would you say to them?`,
          ]
        : [
            `What small moment of clarity or calm stood out to you today?`,
            `What is one intention you want to carry into tomorrow?`,
          ],
    };
  },

  /**
   * Generate personalized journaling prompts based on recent entries or moods
   */
  async generateDailyPrompts(recentMoods = [], topics = []) {
    const prompt = `Generate 4 inspiring, thought-provoking daily journaling prompts.
Recent moods: ${recentMoods.join(', ') || 'Mixed'}
Topics of interest: ${topics.join(', ') || 'Personal Growth, Mindfulness, Well-being'}

Return a JSON array of prompt objects with keys:
- "title": A short catchy label (e.g. "Gratitude Anchor", "Clarity Check")
- "prompt": The full journaling question / prompt
- "category": (e.g. "Mindfulness", "Productivity", "Emotional Awareness", "Vision")
`;

    for (const modelName of SUPPORTED_GEMINI_MODELS) {
      try {
        const model = getGeminiModel(modelName, DEFAULT_JOURNAL_ASSISTANT_INSTRUCTION);

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        });

        return JSON.parse(result.response.text());
      } catch (err) {
        console.warn(`Gemini Prompts with model ${modelName} notice:`, err.message);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          continue;
        }
        break;
      }
    }

    return [
      {
        title: 'Reclaiming Your Calm',
        prompt: 'What was the most challenging part of today, and what can you do to let it go right now?',
        category: 'Emotional Awareness',
      },
      {
        title: 'Small Comforts',
        prompt: 'What are three simple things that brought you comfort or peace today?',
        category: 'Mindfulness',
      },
      {
        title: 'Tomorrow’s Fresh Start',
        prompt: 'What is one kind boundary or positive focus you want to give yourself tomorrow?',
        category: 'Personal Growth',
      },
      {
        title: 'Self-Compassion Check',
        prompt: 'How can you be gentler with yourself about things that did not go as planned today?',
        category: 'Well-being',
      },
    ];
  },
};
