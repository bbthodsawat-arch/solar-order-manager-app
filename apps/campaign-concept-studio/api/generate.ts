import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCampaign } from '../server/campaign.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const result = await generateCampaign(req.body ?? {});
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected generation error.';
    return res.status(400).json({ error: message });
  }
}
