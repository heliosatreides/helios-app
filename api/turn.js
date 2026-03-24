// Vercel serverless function — generates short-lived Cloudflare TURN credentials
// Requires env vars: CLOUDFLARE_TURN_KEY_ID, CLOUDFLARE_TURN_API_TOKEN
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;

  if (!keyId || !apiToken) {
    return res.status(200).json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ]
    });
  }

  try {
    const cfRes = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }),
      }
    );

    if (!cfRes.ok) {
      throw new Error(`Cloudflare TURN API returned ${cfRes.status}`);
    }

    const data = await cfRes.json();

    // Filter out port 53 URLs (blocked by browsers)
    if (data.iceServers) {
      data.iceServers = data.iceServers.map(server => ({
        ...server,
        urls: Array.isArray(server.urls)
          ? server.urls.filter(u => !u.includes(':53'))
          : server.urls,
      }));
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);

  } catch (err) {
    console.error('TURN credential error:', err);
    // Fallback to STUN only
    return res.status(200).json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ]
    });
  }
}
