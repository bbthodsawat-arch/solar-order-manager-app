import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateCampaign } from './server/campaign.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/generate', async (req, res) => {
  try {
    const result = await generateCampaign(req.body);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected generation error.';
    console.error(message);
    res.status(400).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Campaign API listening on http://localhost:${port}`);
});
