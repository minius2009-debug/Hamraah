import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

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
  const TEXT_MODEL = "gemini-3.8-flash";
  const AUDIO_MODEL = "gemini-3.5-transcribe";

  // 1. Voice Booking Processing
  app.post('/api/voice/process', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No audio provided' });

      // Using gemini-3.5-transcribe for best Urdu/Khowar support
      const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: req.file.buffer.toString('base64'),
                  mimeType: req.file.mimetype
                }
              },
              { text: "Transcribe this audio (likely Urdu, Khowar, or English). Then, parse it into structured booking details: origin, destination, service_type (taxi, bike, rickshaw, car, driver, builder, etc.), and timing. Return ONLY JSON format: { \"transcription\": \"...\", \"origin\": \"...\", \"destination\": \"...\", \"service_type\": \"...\", \"timing\": \"...\" }" }
            ]
          }
        ]
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      res.json(JSON.parse(cleanJson));
    } catch (error: any) {
      console.error('Voice Processing Error:', error.message);
      res.status(500).json({ error: 'Failed to process voice request' });
    }
  });

  // 2. Dynamic AI Fare Estimation
  app.post('/api/fare/estimate', async (req, res) => {
    try {
      const { distance, category, timeOfDay, demandLevel, trafficLevel } = req.body;
      
      // Base calculation logic for Chitral
      const rates: Record<string, number> = { 'taxis': 100, 'bikes': 40, 'rickshaws': 60, 'cars': 150, 'drivers': 70 };
      const baseRate = rates[category] || 60;
      const basePrice = Math.round(distance * baseRate);

      // AI Refinement for ranges based on terrain and real-time factors
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{
          role: 'user',
          parts: [{
            text: `Act as a specialized dynamic pricing engine for the rugged terrain of Chitral, Pakistan. 
            Inputs: 
            - Distance: ${distance}km
            - Category: ${category}
            - Time: ${timeOfDay}:00
            - Demand: ${demandLevel}
            - Traffic: ${trafficLevel}
            - Calculated Base Price: PKR ${basePrice}

            Task: Output a competitive and fair price range (Min, Recommended, Max) in PKR. 
            Consider:
            1. Night surcharges (after 8 PM).
            2. High demand peak hours.
            3. Fuel price volatility in remote areas.
            
            Return ONLY JSON: { \"min\": number, \"recommended\": number, \"max\": number, \"surgeReason\": \"string\" }`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error('Fare Estimation Error:', error.message);
      res.status(500).json({ error: 'Failed to estimate fare' });
    }
  });

  // 3. Civic Issue Analysis (Categorization, Grouping, Urgency)
  app.post('/api/civic/analyze', async (req, res) => {
    try {
      const { title, description } = req.body;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{
          role: 'user',
          parts: [{
            text: `Analyze this citizen complaint for Chitral Digital Portal:
            Title: ${title}
            Description: ${description}
            
            Identify:
            1. Real Category (Sanitation, Infrastructure, Electricity, Public Safety, Water, etc.)
            2. Urgency Level (Low, Medium, High, Critical)
            3. A one-sentence summary for government officials.
            4. 3 Keywords for semantic grouping.
            
            Return ONLY JSON: { \"category\": \"string\", \"urgency\": \"string\", \"summary\": \"string\", \"keywords\": [\"...\", \"...\", \"...\"] }`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error('Civic Analysis Error:', error.message);
      res.status(500).json({ error: 'Failed to analyze civic issue' });
    }
  });

  app.post('/api/civic/group', async (req, res) => {
    try {
      const { issues } = req.body; // Array of {id, title, description}

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{
          role: 'user',
          parts: [{
            text: `Given these community issues from Chitral, group them into clusters based on semantic similarity (e.g., all water issues together, all road repairs together).
            
            Issues:
            ${JSON.stringify(issues)}

            Identify clusters and return ONLY JSON: { \"clusters\": [ { \"name\": \"Cluster Name\", \"issueIds\": [\"...\"], \"summary\": \"...\" } ] }`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text || '{ \"clusters\": [] }'));
    } catch (error: any) {
      console.error('Civic Grouping Error:', error.message);
      res.json({ clusters: [] });
    }
  });

  app.post('/api/ai/summarize-job', async (req, res) => {
    try {
      const { description, category } = req.body;
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `You are an expert job coordinator in Chitral, Pakistan. 
        Summarize the following service request into a professional, concise "Provider Brief" that helps a professional understand exactly what needs to be done.
        Keep it under 100 words.
        
        Category: ${category}
        Description: ${description}`,
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error('AI Error (Summarize):', error.message);
      res.json({ summary: req.body.description || 'Professional service request brief.' }); // Safe fallback
    }
  });

  app.post('/api/ai/generate-civic-notice', async (req, res) => {
    try {
      const { title, description, category, upvotesCount } = req.body;
      
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
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
      res.json({ notice: `Community Notice: ${req.body.title || 'Civic Issue'}\n\nThis issue has been raised by the community and is currently under review. Support is growing with ${req.body.upvotesCount || 0} upvotes.` });
    }
  });

  app.post('/api/ai/optimize-profile', async (req, res) => {
    try {
      const { bio, skills, experience } = req.body;
      
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
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
        model: TEXT_MODEL,
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
        model: TEXT_MODEL,
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

  app.post('/api/ai/chitral-events', async (req, res) => {
    const cacheKey = 'events';
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: "Generate 3 upcoming cultural, sports, or community events in Chitral, Pakistan. Return as JSON: { \"events\": [ { \"title\": \"string\", \"date\": \"string\", \"description\": \"string\" } ] }",
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text || '{"events":[]}');
      aiCache.set(cacheKey, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error: any) {
      console.error('AI Error (Events):', error.message);
      if (cached) return res.json(cached.data);
      res.json({
        events: [
          { title: "Shandur Polo Festival", date: "July 7-9", description: "The world's highest polo ground hosts the traditional match between Chitral and Gilgit." },
          { title: "Kalash Chilam Joshi", date: "May 13-16", description: "Spring festival in the Kalash valleys celebrating the arrival of the new season." },
          { title: "Qaqlasht Festival", date: "April", description: "Ancient spring festival on the Qaqlasht plateau featuring local sports and music." }
        ]
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
