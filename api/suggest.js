/**
 * api/suggest.js — Vercel serverless function
 * Proxies BYOK requests to the Anthropic API to avoid browser CORS restrictions.
 * The API key is supplied by the client per-request and never stored server-side.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { apiKey, prompt } = req.body

  if (!apiKey || !prompt) {
    return res.status(400).json({ error: 'Missing apiKey or prompt' })
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid API key format' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message ?? 'Anthropic API error' })
    }

    return res.status(200).json({ text: data.content?.[0]?.text ?? '' })
  } catch (err) {
    return res.status(500).json({ error: 'Proxy request failed: ' + err.message })
  }
}
