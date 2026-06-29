# AI-Mental-Health-Companion
Our Mission is to build an “AI ChatBot” and Our Idea is to implement a character just like a “Psychiatrist” in that “AI ChatBot” and to build the platform where everyone can talk frequently with that “Psychiatrist” and to build that type of “ChatBot” where everyone can express and share his/her own feelings, thoughts and get some mental support.
# 🇮🇳 Nexora — AI Mental Health Companion

A full-stack AI mental health companion with:
- **Chat** — talk to an empathetic AI companion (mood tags, quick replies, crisis safety net)
- **Breathe** — guided breathing exercises (4-7-8, Box Breathing, Relaxing Breath, Physiological Sigh)
- **Meditate** — AI-generated guided meditation scripts with a session timer

---

## Project Structure

```
mental-health-companion/
├── backend/
│   ├── server.js          # Express server + Anthropic API calls
│   ├── package.json
│   └── .env.example        # copy to .env and add your API key
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

The backend serves the frontend too, so you only need **one server running**.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (includes npm)
- An [Anthropic API key](https://console.anthropic.com/settings/keys)
- [VS Code](https://code.visualstudio.com/)

---

## Setup Steps

### 1. Open the project in VS Code
Unzip the project folder, then in VS Code: **File → Open Folder** → select `mental-health-companion`.

### 2. Install backend dependencies
Open a terminal in VS Code (**Terminal → New Terminal**), then run:

```bash
cd backend
npm install
```

### 3. Add your API key
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and paste your real key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
PORT=3001
CLAUDE_MODEL=claude-sonnet-4-6
```

> ⚠️ Never commit `.env` to git — it contains your secret key.

### 4. Start the server

```bash
npm start
```

You should see:

```
🇮🇳 Nexora server running at http://localhost:3003
```

### 5. Open the app
Go to **http://localhost:3003** in your browser. You'll see the full Solace UI — Chat, Breathe, and Meditate tabs all working.

---

## How it works

- The **frontend** (`index.html`, `style.css`, `script.js`) is plain HTML/CSS/JS — no build step, no framework.
- The **backend** (`server.js`) is an Express server that:
  - Serves the frontend as static files
  - Exposes `POST /api/chat` → sends the conversation to Claude with a warm, empathetic system prompt
  - Exposes `POST /api/meditation` → generates a guided meditation script for the selected session
  - Includes a basic crisis-keyword check that adds crisis resources (988, Crisis Text Line) to the AI's instructions if risky language is detected

Your API key **never reaches the browser** — all Claude API calls happen server-side, which is the secure way to do this.

---

## Customization ideas

- **Change the model**: edit `CLAUDE_MODEL` in `.env`
- **Adjust the AI's tone**: edit `SYSTEM_PROMPT` in `backend/server.js`
- **Add more meditations**: add a new `.med-session` block in `index.html` with `data-id`, `data-dur`, `data-title`, `data-emoji`, `data-desc`
- **Add mood history / journaling**: store mood + message data in a database (e.g. SQLite) and add a new tab

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "ANTHROPIC_API_KEY is not set" warning | Make sure `.env` exists in `backend/` and has your real key |
| Chat says "trouble connecting to the server" | Make sure `npm start` is running and you're visiting `http://localhost:3001` |
| Port already in use | Change `PORT` in `.env` to e.g. `3002` |
| Icons not showing | Requires internet access (icons load from a CDN) |

---

## ⚠️ Important Note

This app is a **supportive companion**, not a replacement for professional mental health care.
The chat includes a disclaimer and crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line)
for users who may be in distress. If you deploy this publicly, review and strengthen these safety
measures (e.g., more robust crisis detection, clearer disclaimers, rate limiting).
