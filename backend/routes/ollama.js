const express = require('express');
const router = express.Router();

function extractRooms(prompt) {
  const p = prompt.toLowerCase();
  
  // 1. Parse floors (detect e.g., "3 floors", "3 floor", "3-story", "triple story")
  let floorCount = 1;
  const floorMatch = p.match(/(\d+)\s*(?:floor|storey|story|level|flr|stry)s?/);
  const storyMatch = p.match(/(\d+)\s*story/);
  
  if (floorMatch) {
    floorCount = parseInt(floorMatch[1]);
  } else if (storyMatch) {
    floorCount = parseInt(storyMatch[1]);
  } else if (p.includes('double story') || p.includes('two floor') || p.includes('2 floor') || p.includes('second floor')) {
    floorCount = 2;
  } else if (p.includes('triple story') || p.includes('three floor') || p.includes('3 floor') || p.includes('third floor')) {
    floorCount = 3;
  } else if (p.includes('four story') || p.includes('four floor') || p.includes('4 floor') || p.includes('fourth floor')) {
    floorCount = 4;
  } else {
    if (p.includes('one floor') || p.includes('one story') || p.includes('single floor') || p.includes('single story')) {
      floorCount = 1;
    } else if (p.includes('two floor') || p.includes('two story') || p.includes('double floor') || p.includes('double story')) {
      floorCount = 2;
    } else if (p.includes('three floor') || p.includes('three story') || p.includes('triple floor') || p.includes('triple story')) {
      floorCount = 3;
    } else if (p.includes('four floor') || p.includes('four story') || p.includes('quadruple floor') || p.includes('quadruple story')) {
      floorCount = 4;
    }
  }

  // Cap floorCount between 1 and 4 for visual correctness
  floorCount = Math.max(1, Math.min(4, floorCount));

  // 2. Clean floor-related digits/words out of the string before parsing bedroom count
  const cleanedForBedrooms = p
    .replace(/\b\d+\s*(?:floor|storey|story|level|flr|stry)s?\b/g, '')
    .replace(/\b(?:one|two|three|four|single|double|triple|quadruple)\s*(?:floor|storey|story|level|flr|stry)s?\b/g, '');

  // 3. Parse bedroom count (detect e.g., "3bhk", "3 bhk", "3 bed", "three bedroom")
  let bedroomCount = 3; // Default to 3 BHK if unspecified
  const bhkMatch = cleanedForBedrooms.match(/(\d+)\s*bhk/);
  const bedroomMatch = cleanedForBedrooms.match(/(\d+)\s*(?:bed|bedroom)s?/);

  if (bhkMatch) {
    bedroomCount = parseInt(bhkMatch[1]);
  } else if (bedroomMatch) {
    bedroomCount = parseInt(bedroomMatch[1]);
  } else {
    if (cleanedForBedrooms.includes('four bed') || cleanedForBedrooms.includes('4 bed') || cleanedForBedrooms.includes('four bhk') || cleanedForBedrooms.includes('4 bhk') || cleanedForBedrooms.includes('four bedroom') || cleanedForBedrooms.includes('4 bedroom')) {
      bedroomCount = 4;
    } else if (cleanedForBedrooms.includes('three bed') || cleanedForBedrooms.includes('3 bed') || cleanedForBedrooms.includes('three bhk') || cleanedForBedrooms.includes('3 bhk') || cleanedForBedrooms.includes('three bedroom') || cleanedForBedrooms.includes('3 bedroom')) {
      bedroomCount = 3;
    } else if (cleanedForBedrooms.includes('two bed') || cleanedForBedrooms.includes('2 bed') || cleanedForBedrooms.includes('two bhk') || cleanedForBedrooms.includes('2 bhk') || cleanedForBedrooms.includes('two bedroom') || cleanedForBedrooms.includes('2 bedroom')) {
      bedroomCount = 2;
    } else if (cleanedForBedrooms.includes('one bed') || cleanedForBedrooms.includes('1 bed') || cleanedForBedrooms.includes('one bhk') || cleanedForBedrooms.includes('1 bhk') || cleanedForBedrooms.includes('one bedroom') || cleanedForBedrooms.includes('1 bedroom')) {
      bedroomCount = 1;
    } else {
      if (cleanedForBedrooms.includes('1')) bedroomCount = 1;
      else if (cleanedForBedrooms.includes('2')) bedroomCount = 2;
      else if (cleanedForBedrooms.includes('3')) bedroomCount = 3;
      else if (cleanedForBedrooms.includes('4')) bedroomCount = 4;
      else if (cleanedForBedrooms.includes('one')) bedroomCount = 1;
      else if (cleanedForBedrooms.includes('two')) bedroomCount = 2;
      else if (cleanedForBedrooms.includes('three')) bedroomCount = 3;
      else if (cleanedForBedrooms.includes('four')) bedroomCount = 4;
    }
  }

  bedroomCount = Math.max(1, Math.min(4, bedroomCount));

  const rooms = [];
  for (let i = 0; i < bedroomCount; i++) rooms.push('bedroom');
  rooms.push('kitchen');
  rooms.push('living');
  rooms.push('dining');
  if (p.includes('bathroom') || p.includes('bath')) rooms.push('bathroom');
  if (p.includes('parking') || p.includes('garage')) rooms.push('parking');
  if (p.includes('balcony') || p.includes('terrace')) rooms.push('balcony');

  return { rooms, bedroomCount, floorCount };
}

function buildHouseLayout(constraints, roomList, bedroomCount, floorCount) {
  const totalW = parseFloat(constraints?.width || 10);
  const totalL = parseFloat(constraints?.length || 15);
  const wallColor = constraints?.color || '#f5f5f5';

  const rW = totalW / 2;
  const rL = totalL / 2;

  const rooms = [];
  const floorH = 1.9; // height of a single floor (WALL_H 1.8 + FLOOR_T 0.1)

  for (let floor = 0; floor < floorCount; floor++) {
    const y = floor * floorH;

    if (floor === 0) {
      // Ground floor: core social spaces
      rooms.push({ type: 'kitchen', position: [-rW * 0.45, y, -rL * 0.55], size: [rW * 0.7, rL * 0.4] });
      rooms.push({ type: 'dining', position: [rW * 0.45, y, -rL * 0.55], size: [rW * 0.7, rL * 0.4] });
      rooms.push({ type: 'living', position: [0, y, rL * 0.45], size: [rW * 1.5, rL * 0.45] });
      rooms.push({ type: 'bathroom', position: [rW * 0.45, y, -rL * 0.1], size: [rW * 0.6, rL * 0.22] });
      
      if (floorCount > 1) {
        rooms.push({ type: 'stairs', position: [-rW * 0.45, y, -rL * 0.1], size: [rW * 0.4, rL * 0.3] });
      }

      if (roomList.includes('parking')) {
        rooms.push({ type: 'parking', position: [-rW * 0.55, y, rL * 0.72], size: [rW * 0.65, rL * 0.25] });
      }

      // If only 1 floor, put bedrooms on ground floor
      if (floorCount === 1) {
        if (bedroomCount >= 1) {
          rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, -rL * 0.05], size: [rW * 0.65, rL * 0.35] });
        }
        if (bedroomCount >= 2) {
          rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
        }
        if (bedroomCount >= 3) {
          rooms.push({ type: 'bedroom', position: [rW * 0.45, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
        }
      }
    } else if (floor === 1) {
      // First floor: Bedrooms + Bathroom + Balcony
      if (bedroomCount >= 1) {
        rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, -rL * 0.05], size: [rW * 0.65, rL * 0.35] });
      }
      if (bedroomCount >= 2) {
        rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
      }

      rooms.push({ type: 'bathroom', position: [rW * 0.45, y, -rL * 0.1], size: [rW * 0.6, rL * 0.22] });
      
      if (floorCount > 2) {
        rooms.push({ type: 'stairs', position: [-rW * 0.45, y, -rL * 0.1], size: [rW * 0.4, rL * 0.3] });
      }

      // If 3 BHK and only 2 floors, place bedroom 3 on floor 1
      if (bedroomCount >= 3 && floorCount === 2) {
        rooms.push({ type: 'bedroom', position: [rW * 0.45, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
      } else {
        // Balcony / open terrace
        rooms.push({ type: 'hall', position: [rW * 0.45, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
      }
    } else if (floor === 2) {
      // Second floor: Bedroom 3/4 + Terrace
      if (bedroomCount >= 3) {
        rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, -rL * 0.05], size: [rW * 0.65, rL * 0.35] });
      }
      if (bedroomCount >= 4 && floorCount === 3) {
        rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, rL * 0.4], size: [rW * 0.65, rL * 0.35] });
      }

      rooms.push({ type: 'bathroom', position: [rW * 0.45, y, -rL * 0.1], size: [rW * 0.6, rL * 0.22] });
      
      if (floorCount > 3) {
        rooms.push({ type: 'stairs', position: [-rW * 0.45, y, -rL * 0.1], size: [rW * 0.4, rL * 0.3] });
      }

      // Open terrace
      rooms.push({ type: 'hall', position: [rW * 0.42, y, rL * 0.45], size: [rW * 1.3, rL * 0.45] });
    } else if (floor === 3) {
      // Third floor: Study / penthouse / deck
      if (bedroomCount >= 4) {
        rooms.push({ type: 'bedroom', position: [-rW * 0.55, y, -rL * 0.05], size: [rW * 0.65, rL * 0.35] });
      }
      rooms.push({ type: 'bathroom', position: [rW * 0.45, y, -rL * 0.1], size: [rW * 0.6, rL * 0.22] });
      rooms.push({ type: 'hall', position: [rW * 0.42, y, rL * 0.45], size: [rW * 1.3, rL * 0.45] });
    }
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
    const { rooms: roomList, bedroomCount, floorCount } = extractRooms(prompt);
    const houseLayout = buildHouseLayout(constraints, roomList, bedroomCount, floorCount);

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
      aiText = `I've designed a beautiful ${floorCount}-floor ${bedroomCount}-bedroom (BHK) plan on your ${constraints?.width || 10}×${constraints?.length || 15}m plot. The layout includes a spacious living room, modern open-plan kitchen-dining, ${bedroomCount} bedrooms, ${floorCount > 1 ? 'connecting staircases,' : ''} and bathrooms. The 3D interactive dollhouse model has been fully rendered on the right — you can rotate, zoom and explore each floor!`;
    }

    res.json({ response: aiText, ...houseLayout });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
