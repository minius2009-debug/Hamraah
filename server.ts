import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

async function createServer() {
  const app = express();
  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  const MODEL_NAME = "gemini-3.8-flash";

  app.post('/api/ai/summarize-job', async (req, res) => {
    try {
      const { description, category } = req.body;
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `You are an expert job coordinator in Chitral, Pakistan. 
        Summarize the following service request into a professional, concise "Provider Brief" that helps a professional understand exactly what needs to be done.
        Keep it under 100 words.
        
        Category: ${category}
        Description: ${description}`,
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error('AI Error (Summarize):', error.message);
      res.json({ summary: description }); // Safe fallback
    }
  });

  app.post('/api/ai/generate-civic-notice', async (req, res) => {
    try {
      const { title, description, category, upvotesCount } = req.body;
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `You are a professional legal assistant in Chitral. 
        Generate a formal "Official Community Notice" regarding:
        
        Issue Title: ${title}
        Category: ${category}
        Community Detail: ${description}
        Upvotes: ${upvotesCount}
        
        The tone should be professional.`,
      });

      res.json({ notice: response.text });
    } catch (error: any) {
      console.error('AI Error (Notice):', error.message);
      res.json({ notice: `Community Notice: ${title}\n\nThis issue has been raised by the community and is currently under review. Support is growing with ${req.body.upvotesCount} upvotes.` });
    }
  });

  app.post('/api/ai/optimize-profile', async (req, res) => {
    try {
      const { bio, skills, experience } = req.body;
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Optimize this professional bio for a service provider in Chitral: ${bio}. Return BIO: [text] and SKILLS: [list].`,
      });

      const text = response.text || '';
      const bioMatch = text.match(/BIO:\s*([\s\S]*?)(?=SKILLS:|$)/i);
      const skillsMatch = text.match(/SKILLS:\s*([\s\S]*)/i);

      res.json({ 
        optimizedBio: bioMatch ? bioMatch[1].trim() : bio, 
        recommendedSkills: skillsMatch ? skillsMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '')) : [] 
      });
    } catch (error: any) {
      console.error('AI Error (Optimize):', error.message);
      res.json({ optimizedBio: req.body.bio, recommendedSkills: [] });
    }
  });

  // Simple in-memory cache for AI responses
  const aiCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours (wisdom/goals change slowly)

  app.get('/api/ai/chitral-wisdom', async (req, res) => {
    const cacheKey = 'wisdom';
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: "Provide a single, random, inspiring cultural fact or proverb from Chitral, Pakistan. Format it as JSON: { \"text\": \"...\", \"category\": \"...\" }",
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text || '{}');
      aiCache.set(cacheKey, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error: any) {
      if (error.message?.includes('429')) {
        console.warn('AI Quota reached (Wisdom). Using static fallback.');
      } else {
        console.error('AI Error (Wisdom):', error.message);
      }
      
      if (cached) return res.json(cached.data);
      res.json({ 
        text: "Nan-e-Nisik, Dad-e-Hasek (Mother is a spring, Father is a shadow).", 
        category: "Proverb" 
      });
    }
  });

  app.get('/api/ai/community-goals', async (req, res) => {
    const cacheKey = 'goals';
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: "Generate simulated weekly community service goals for Chitral. Return as JSON: { \"total_hours_goal\": number, \"hours_completed\": number, \"volunteers\": number, \"message\": \"string\" }",
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text || '{}');
      aiCache.set(cacheKey, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error: any) {
      if (error.message?.includes('429')) {
        console.warn('AI Quota reached (Goals). Using static fallback.');
      } else {
        console.error('AI Error (Goals):', error.message);
      }

      if (cached) return res.json(cached.data);
      res.json({
        total_hours_goal: 500,
        hours_completed: 342,
        volunteers: 120,
        message: "Chitral grows stronger when we work together!"
      });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const port = 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
