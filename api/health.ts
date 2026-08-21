import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
