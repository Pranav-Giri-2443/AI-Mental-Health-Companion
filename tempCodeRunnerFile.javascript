// ===========================================================================
// Nexora — AI Mental Health Companion (frontend logic)
// Talks to the local backend at /api/chat and /api/meditation
// ===========================================================================

const API_BASE = ''; // same-origin; change to e.g. 'http://localhost:3001' if frontend is served separately

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-panel').classList.add('active');
  });
});

// ---------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const typingEl = document.getElementById('typing');
const quickRepliesEl = document.getElementById('quick-replies');

let convHistory = [];
let selectedMood = null;

document.getElementById('initial-time').textContent = getTime();

document.querySelectorAll('.mood-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMood = btn.dataset.mood;
    inputEl.focus();
  });
});

document.querySelectorAll('.qr-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    inputEl.value = btn.textContent;
    autoResize(inputEl);
    sendMessage();
  });
});

inputEl.addEventListener('input', () => autoResize(inputEl));
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-av">${role === 'ai' ? '🌿' : '👤'}</div>
    <div>
      <div class="bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="msg-time">${getTime()}</div>
    </div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setTyping(visible) {
  typingEl.classList.toggle('show', visible);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  quickRepliesEl.innerHTML = '';
  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;

  let userText = text;
  if (selectedMood) {
    userText = `[Mood: ${selectedMood}] ${text}`;
    selectedMood = null;
    document.querySelectorAll('.mood-btn').forEach((b) => b.classList.remove('active'));
  }

  appendMessage('user', text);
  convHistory.push({ role: 'user', content: userText });

  setTyping(true);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: convHistory }),
    });

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    const reply = data.reply || "I'm here with you. Can you tell me more?";

    convHistory.push({ role: 'assistant', content: reply });
    setTyping(false);
    appendMessage('ai', reply);
  } catch (err) {
    console.error(err);
    setTyping(false);
    appendMessage(
      'ai',
      "I'm having trouble connecting to the server right now. Make sure the backend is running, then try again — I'm here for you."
    );
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

// ---------------------------------------------------------------------
// Breathing exercises
// ---------------------------------------------------------------------
const TECHS = {
  '4-7-8': [
    { label: 'Inhale', dur: 4 },
    { label: 'Hold', dur: 7 },
    { label: 'Exhale', dur: 8 },
  ],
  box: [
    { label: 'Inhale', dur: 4 },
    { label: 'Hold', dur: 4 },
    { label: 'Exhale', dur: 4 },
    { label: 'Hold', dur: 4 },
  ],
  '4-4-4': [
    { label: 'Inhale', dur: 4 },
    { label: 'Exhale', dur: 4 },
  ],
  physiological: [
    { label: 'Inhale', dur: 2 },
    { label: 'Inhale more', dur: 1 },
    { label: 'Exhale slowly', dur: 6 },
  ],
};

let currentTech = '4-7-8';
let breatheRunning = false;
let breatheTimer = null;
let bCycle = 0;
let bPhase = 0;
let bRemain = 0;
let bFrac = 0;

const breatheLabel = document.getElementById('breathe-label');
const breatheSublabel = document.getElementById('breathe-sublabel');
const breatheTimerEl = document.getElementById('breathe-timer');
const cyclesRange = document.getElementById('cycles-range');
const cyclesVal = document.getElementById('cycles-val');
const ring = document.getElementById('bc-ring');
const inner = document.getElementById('bc-inner');

cyclesRange.addEventListener('input', () => {
  cyclesVal.textContent = cyclesRange.value;
});

document.querySelectorAll('.tech-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.tech-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    currentTech = card.dataset.tech;
    stopBreathing();
  });
});

document.getElementById('start-btn').addEventListener('click', startBreathing);
document.getElementById('reset-btn').addEventListener('click', stopBreathing);

function circleFill(pct) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  ring.setAttribute('stroke-dashoffset', circ * (1 - pct));
}

function setInnerScale(pct) {
  const s = 0.5 + pct * 0.5;
  inner.setAttribute('r', 30 * s);
  inner.setAttribute('opacity', 0.4 + pct * 0.4);
}

function stopBreathing() {
  clearInterval(breatheTimer);
  breatheRunning = false;
  bCycle = 0;
  bPhase = 0;
  bRemain = 0;
  bFrac = 0;
  breatheLabel.textContent = 'Ready';
  breatheSublabel.textContent = 'Select a technique and press Start';
  breatheTimerEl.classList.add('hidden');
  circleFill(0);
  setInnerScale(0);
}

function startBreathing() {
  if (breatheRunning) return;
  breatheRunning = true;
  bCycle = 0;
  bPhase = 0;
  bFrac = 0;

  const cycles = parseInt(cyclesRange.value, 10);
  const phases = TECHS[currentTech];
  breatheTimerEl.classList.remove('hidden');
  bRemain = phases[0].dur;
  updateBreathDisplay(cycles);

  breatheTimer = setInterval(() => tick(cycles), 100);
}

function tick(cycles) {
  const phases = TECHS[currentTech];
  bFrac += 0.1 / phases[bPhase].dur;

  if (bFrac >= 1) {
    bFrac = 0;
    bPhase++;
    if (bPhase >= phases.length) {
      bPhase = 0;
      bCycle++;
    }
    if (bCycle >= cycles) {
      clearInterval(breatheTimer);
      breatheRunning = false;
      breatheLabel.textContent = 'Well done 🌿';
      breatheSublabel.textContent = 'Take a moment to notice how you feel';
      circleFill(0);
      setInnerScale(0.5);
      return;
    }
    bRemain = phases[bPhase].dur;
  }

  bRemain = Math.max(0, phases[bPhase].dur - bFrac * phases[bPhase].dur);
  updateBreathDisplay(cycles);

  const ph = phases[bPhase].label.toLowerCase();
  if (ph.includes('inhale') || ph.includes('more')) {
    circleFill(bFrac);
    setInnerScale(bFrac);
  } else if (ph.includes('exhale')) {
    circleFill(1 - bFrac);
    setInnerScale(1 - bFrac);
  } else {
    circleFill(1);
    setInnerScale(1);
  }
}

function updateBreathDisplay(cycles) {
  const phases = TECHS[currentTech];
  breatheLabel.textContent = phases[bPhase].label;
  breatheSublabel.textContent = Math.ceil(bRemain) + ' seconds';
  breatheTimerEl.textContent = `Cycle ${bCycle + 1} of ${cycles}`;
}

// ---------------------------------------------------------------------
// Meditation
// ---------------------------------------------------------------------
let medDur = 300;
let medElapsed = 0;
let medPlaying = false;
let medInterval = null;

const sessionListEl = document.getElementById('session-list');
const medPlayerEl = document.getElementById('med-player');
const medTitleEl = document.getElementById('med-title');
const medAiTextEl = document.getElementById('med-ai-text');
const medProgressBar = document.getElementById('med-progress-bar');
const medElapsedEl = document.getElementById('med-elapsed');
const medTotalEl = document.getElementById('med-total');
const medPlayIcon = document.getElementById('med-play-icon');
const medStatusEl = document.getElementById('med-status');

document.querySelectorAll('.med-session').forEach((el) => {
  el.addEventListener('click', () => startMed(el));
});
document.getElementById('med-play-btn').addEventListener('click', toggleMed);
document.getElementById('med-close-btn').addEventListener('click', closeMed);

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

async function startMed(el) {
  const { dur, title, emoji, desc } = el.dataset;
  medDur = parseInt(dur, 10);
  medElapsed = 0;
  medPlaying = false;
  clearInterval(medInterval);

  sessionListEl.style.display = 'none';
  medPlayerEl.classList.remove('hidden');
  medTitleEl.textContent = `${emoji} ${title}`;
  medTotalEl.textContent = fmtTime(medDur);
  medElapsedEl.textContent = '0:00';
  medProgressBar.style.width = '0%';
  medPlayIcon.className = 'ti ti-player-play';
  medStatusEl.textContent = 'Press play to begin';
  medAiTextEl.textContent = 'Generating your session…';

  try {
    const res = await fetch(`${API_BASE}/api/meditation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, duration: medDur }),
    });

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    medAiTextEl.textContent =
      data.script || 'Close your eyes, breathe gently, and allow yourself to arrive here...';
  } catch (err) {
    console.error(err);
    medAiTextEl.textContent =
      'Close your eyes. Breathe slowly. Allow yourself to be here, just as you are...';
  }
}

function toggleMed() {
  if (!medPlaying) {
    medPlaying = true;
    medPlayIcon.className = 'ti ti-player-pause';
    medStatusEl.textContent = 'Session in progress…';

    medInterval = setInterval(() => {
      medElapsed++;
      medElapsedEl.textContent = fmtTime(medElapsed);
      medProgressBar.style.width = Math.min(100, (medElapsed / medDur) * 100) + '%';

      if (medElapsed >= medDur) {
        clearInterval(medInterval);
        medPlaying = false;
        medPlayIcon.className = 'ti ti-check';
        medStatusEl.textContent = 'Session complete 🌿';
      }
    }, 1000);
  } else {
    medPlaying = false;
    clearInterval(medInterval);
    medPlayIcon.className = 'ti ti-player-play';
    medStatusEl.textContent = 'Paused';
  }
}

function closeMed() {
  clearInterval(medInterval);
  medPlaying = false;
  medPlayerEl.classList.add('hidden');
  sessionListEl.style.display = 'flex';
}

