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
  app.post('/api/ai/summarize-job', async (req, res) => {
    try {
      const { description, category } = req.body;
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are an expert job coordinator in Chitral, Pakistan. 
        Summarize the following service request into a professional, concise "Provider Brief" that helps a professional understand exactly what needs to be done.
        Keep it under 100 words.
        
        Category: ${category}
        Description: ${description}`,
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/generate-civic-notice', async (req, res) => {
    try {
      const { title, description, category, upvotesCount } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are a professional legal assistant in Chitral. 
        Generate a formal "Official Community Notice" or "Letter to the Deputy Commissioner" regarding a civic issue that has received significant community support (${upvotesCount} upvotes).
        The tone should be respectful but firm and professional.
        Include sections for: Subject, Context, The Issue, Community Impact, and Proposed Resolution.
        
        Issue Title: ${title}
        Category: ${category}
        Community Detail: ${description}`,
      });

      res.json({ notice: response.text });
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/optimize-profile', async (req, res) => {
    try {
      const { bio, skills, experience } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are a professional career coach in Chitral, Pakistan. 
        Analyze the following Service Provider profile and provide a professional, catchy "Optimized Bio" and a list of "Recommended Skill Tags" that would help them get more jobs on the Hamraah app.
        Keep the bio under 150 words and professional.
        
        Current Bio: ${bio || 'Not provided'}
        Experience: ${experience} years
        Skills: ${skills?.join(', ') || 'None listed'}
        
        Return the response in this exact format:
        BIO: [Optimized Bio]
        SKILLS: [Skill1, Skill2, Skill3, etc.]`,
      });

      const text = response.text || '';
      const bioMatch = text.match(/BIO:\s*([\s\S]*?)(?=SKILLS:|$)/i);
      const skillsMatch = text.match(/SKILLS:\s*([\s\S]*)/i);

      res.json({ 
        optimizedBio: bioMatch ? bioMatch[1].trim() : '', 
        recommendedSkills: skillsMatch ? skillsMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '')) : [] 
      });
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: error.message });
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
