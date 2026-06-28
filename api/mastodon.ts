import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // 5分钟缓存

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_URL =
    'https://m.cmx.im/api/v1/accounts/116669312102420954/statuses?exclude_replies=true&exclude_reblogs=true&limit=20';

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Mastodon API error: ${response.status}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch Mastodon data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}