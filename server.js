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

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // To do the chat format ready for Gemini
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Connection error" });
  }
});

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