const express = require('express');
const router = express.Router();

function extractRooms(prompt) {
  const p = prompt.toLowerCase();
  const rooms = [];
  const bedroomMatch = p.match(/(\d+)\s*bed/);
  const bedroomCount = bedroomMatch ? parseInt(bedroomMatch[1]) : 2;
  for (let i = 0; i < bedroomCount; i++) rooms.push('bedroom');
  if (p.includes('kitchen')) rooms.push('kitchen');
  else rooms.push('kitchen'); // always include kitchen
  if (p.includes('bathroom') || p.includes('bath')) rooms.push('bathroom');
  if (p.includes('living') || p.includes('hall')) rooms.push('living');
  else rooms.push('living');
  if (p.includes('dining')) rooms.push('dining');
  else rooms.push('dining');
  if (p.includes('parking') || p.includes('garage')) rooms.push('parking');
  if (p.includes('balcony') || p.includes('terrace')) rooms.push('balcony');
  return { rooms, bedroomCount };
}

function buildHouseLayout(constraints, roomList, bedroomCount) {
  const totalW = parseFloat(constraints?.width || 12);
  const totalL = parseFloat(constraints?.length || 15);
  const wallColor = constraints?.color || '#f5f5f5';
  const scale = Math.min(totalW / 12, totalL / 15);

  const rW = totalW / 2;
  const rL = totalL / 2;

  // Base layout: rooms as { type, position:[x,z], size:[w,d] }
  const rooms = [];

  // Kitchen top-left
  rooms.push({ type: 'kitchen', position: [-rW * 0.5, 0, -rL * 0.55], size: [rW * 0.7, rL * 0.4] });

  // Dining top-right
  rooms.push({ type: 'dining', position: [rW * 0.4, 0, -rL * 0.55], size: [rW * 0.8, rL * 0.4] });

  // Bedroom(s) middle-left
  if (bedroomCount >= 1) {
    rooms.push({ type: 'bedroom', position: [-rW * 0.55, 0, -rL * 0.05], size: [rW * 0.65, rL * 0.35] });
  }
  if (bedroomCount >= 2) {
    rooms.push({ type: 'bedroom', position: [-rW * 0.55, 0, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
  }
  if (bedroomCount >= 3) {
    rooms.push({ type: 'bedroom', position: [rW * 0.45, 0, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
  }

  // Bathroom small
  rooms.push({ type: 'bathroom', position: [rW * 0.45, 0, -rL * 0.12], size: [rW * 0.6, rL * 0.22] });

  // Stairs center
  rooms.push({ type: 'stairs', position: [0.5, 0, rL * 0.1], size: [rW * 0.4, rL * 0.3] });

  // Living room full bottom
  rooms.push({ type: 'living', position: [rW * 0.42, 0, rL * 0.45], size: [rW * 1.3, rL * 0.45] });

  // Parking pad if requested
  if (roomList.includes('parking')) {
    rooms.push({ type: 'parking', position: [-rW * 0.55, 0, rL * 0.72], size: [rW * 0.65, rL * 0.25] });
  }

  return { rooms, wallColor, dimensions: { w: totalW, l: totalL } };
}

router.get('/status', (req, res) => {
  res.json({
    grokActive: !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
    grokModel: process.env.GROK_MODEL || 'grok-beta',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, model = 'llama3', constraints, grokApiKey: bodyKey } = req.body;
    const { rooms: roomList, bedroomCount } = extractRooms(prompt);
    const houseLayout = buildHouseLayout(constraints, roomList, bedroomCount);

    const constraintText = constraints
      ? `\nPlot: ${constraints.width}m × ${constraints.length}m, Budget: $${constraints.budget}\n`
      : '';

    let aiText = '';

    // 1. Try Grok AI (xAI API) if a key is provided via header, body, or backend env
    const grokApiKey = req.headers['x-grok-api-key'] || bodyKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokApiKey) {
      try {
        const grokModel = process.env.GROK_MODEL || 'grok-beta';
        console.log(`Contacting Grok API (https://api.x.ai/v1) using model: ${grokModel}...`);
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokApiKey}`
          },
          body: JSON.stringify({
            model: grokModel,
            messages: [
              {
                role: 'system',
                content: `You are a professional AI architect. Give a short 3-4 sentence architectural recommendation.${constraintText}`
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (grokRes.ok) {
          const d = await grokRes.json();
          aiText = d?.choices?.[0]?.message?.content || '';
          console.log('Grok AI response retrieved successfully.');
        } else {
          const errText = await grokRes.text();
          console.warn(`Grok API returned error status ${grokRes.status}:`, errText);
        }
      } catch (e) {
        console.warn('Grok API invocation failed, falling back:', e.message);
      }
    }

    // 2. Fallback to local Ollama if Grok is not used or failed
    if (!aiText.trim()) {
      try {
        console.log('Contacting local Ollama server at http://localhost:11434/api/generate...');
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            system: `You are a professional AI architect. Give a short 3-4 sentence architectural recommendation.${constraintText}`,
            stream: false
          }),
          signal: AbortSignal.timeout(25000)
        });
        if (ollamaRes.ok) {
          const d = await ollamaRes.json();
          aiText = d?.response || '';
          console.log('Ollama local response retrieved successfully.');
        }
      } catch (e) {
        console.warn('Ollama offline, using standard text fallback.');
      }
    }

    // 3. absolute fallback if both fail or are offline
    if (!aiText.trim()) {
      aiText = `I've designed a ${bedroomCount}-bedroom floor plan on your ${constraints?.width || 12}×${constraints?.length || 15}m plot. The layout includes a spacious living room, open-plan kitchen-dining, ${bedroomCount} bedrooms, and a bathroom. The 3D interactive model has been generated on the right — you can rotate, zoom and explore each room!`;
    }

    res.json({ response: aiText, ...houseLayout });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
