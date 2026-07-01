require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3003;

// System prompt remains the same
const SYSTEM_PROMPT = `You are nexora, a warm and empathetic AI mental health companion...`;

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
   model: "gemini-2.5-flash",
  systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, '0.0.0.0', () =>
{
  console.log( `Server running at http://localhost:${PORT}`);
});
// ----------------------------------------------------------
// POST /api/meditation
// body: { title: string, description: string, duration: number (seconds) }
// ----------------------------------------------------------
app.post('/api/meditation', async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    // Validate input
    if (!title || !duration) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    const minutes = Math.max(1, Math.round(duration / 60));

    const prompt = `You are a calm, warm meditation guide. Write a continuous guided meditation
    script for a session titled "${title}". Description: "${description || ''}".
    Target Duration: approximately ${minutes} minute(s) of slow, spoken narration.
    Use second person ("you"), present tense, and gentle pacing with natural pause cues ("...").
    Do not use headings, bullet points, or markdown. Write flowing prose only, as if speaking aloud.
    Keep it soothing, grounding, and free of any medical claims. Start immediately with the guidance.`;

    // Call the Gemini API for the meditation script
    const result = await model.generateContent(prompt);
    const script = result.response.text();

    res.json({ script });
  } catch (err) {
    console.error('Error in /api/meditation:', err);
    res.status(500).json({ 
      error: 'Could not generate meditation script. Please try again.',
     });
  }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || "";
        const RISK_ANALYSIS_PROMPT = `Analyze this message and history for risk evaluation. Respond ONLY with a valid JSON object with these keys: "detectedEmotion", "riskLevel", "copingStrategy", "reply".`;

        const chatHistory = messages.slice(0, -1).map(m => ({ 
            role: m.role === 'user' ? 'user' : 'model', 
            parts: [{ text: m.content }] 
        }));
        
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(`User Message: "${lastUserMessage}"\n\n${RISK_ANALYSIS_PROMPT}`);
        const rawText = result.response.text();
        
        // Clean and parse
        const cleanJsonString = rawText.replace(/```json|```/g, "").trim();
        const evaluation = JSON.parse(cleanJsonString);

        res.json({
            reply: evaluation.reply,
            riskAssessment: {
                detectedEmotion: evaluation.detectedEmotion,
                riskLevel: evaluation.riskLevel,
                copingStrategy: evaluation.copingStrategy
            }
        });
    } catch (err) {
        console.error("Backend Error:", err.message);
        // Distinguish between API quota issues and parsing errors
        const status = err.message.includes('429') ? 429 : 500;
        res.status(status).json({ 
            error: "Service busy or format error", 
            details: err.message 
        });
    }
});