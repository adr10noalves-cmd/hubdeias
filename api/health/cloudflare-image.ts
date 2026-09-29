import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCloudflareHealthDiagnostics } from '../_shared/cloudflareImageAdapter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const diag = getCloudflareHealthDiagnostics();
    res.status(200).json(diag);
  } catch (err: any) {
    res.status(500).json({
      configured: false,
      status: 'CONFIG_ERROR',
      error: err?.message,
    });
  }
}
