const fetch = require('node-fetch');

const API_ENDPOINT = 'http://localhost:3003/api/chat';

const SIMULATIONS = [
  { id: 1, emotion: "Stress", input: "Work is piling up insanely high, I have a deadline tomorrow and my heart won't stop racing." },
  { id: 2, emotion: "Anxiety", input: "I keep worrying that something awful is going to happen to my family. I haven't slept in three days." },
  { id: 3, emotion: "Depressive Tendencies", input: "Everything feels so empty lately. I don't see the point in waking up or hanging out with friends anymore." },
  { id: 4, emotion: "Normal", input: "Hey Nexora, I had a pretty productive day today, just checking in to clear my mind." },
  { id: 5, emotion: "Stress", input: "Balancing university assignments with my part-time job is getting completely exhausting." },
  { id: 6, emotion: "Anxiety", input: "I have a presentation tomorrow and my hands are shaking just thinking about speaking in front of people." },
  { id: 7, emotion: "Depressive Tendencies", input: "I'm just tired of feeling like a failure all the time. I cry almost every single night now." },
  { id: 8, emotion: "High Risk Crisis", input: "I feel completely hopeless. I don't want to live through this pain anymore, I want to end it." },
  { id: 9, emotion: "Stress", input: "Traffic was unbearable today and it ruined my mood, just looking to destress a bit." },
  { id: 10, emotion: "Anxiety", input: "Out of nowhere, it feels like the room is spinning and I can't catch my breath. I feel terrified." }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runValidationSuite() {
  console.log("🚀 Starting Validation (Slow Mode Enabled)...");

  for (const simulation of SIMULATIONS) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: simulation.input }] })
      });

      const data = await response.json();

      // This logic is now correctly placed INSIDE the loop
      if (data.error) {
        console.error(`❌ Case ${simulation.id} failed: Server returned error -> ${data.error}`);
      } else if (!data.riskAssessment) {
        console.error(`❌ Case ${simulation.id} failed: Malformed response (Missing riskAssessment)`);
      } else {
        const assessment = data.riskAssessment;
        console.log(`▶️ Case ${simulation.id} (${simulation.emotion}) passed: Risk level ${assessment.riskLevel}`);
      }

    } catch (e) {
      console.error(`❌ Connection error on case ${simulation.id}`);
    }
    
    // Pause to prevent hitting the Google API limit
    console.log("⏳ Pausing for 25 seconds...");
    await sleep(25000); 
  }
  console.log("🏁 Validation complete.");
}

runValidationSuite();