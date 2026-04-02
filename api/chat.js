// api/chat.js
export default async function handler(req, res) {
  // Allow OPTIONS method for pre-flight requests (CORS) if needed, 
  // although usually not needed for Vercel same-domain calls.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check both standard and VITE-prefixed name as users often mix them up
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error('SERVER ERROR: OpenAI API Key is missing in Vercel environment variables.');
    return res.status(500).json({ 
      error: 'OpenAI API Key is missing.', 
      details: 'Please set OPENAI_API_KEY or VITE_OPENAI_API_KEY in Vercel dashboard.' 
    });
  }

  try {
    const { model, messages, response_format, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid payload: messages must be an array.' });
    }

    console.log(`OpenAI Proxy: Calling ${model || 'gpt-4o-mini'}...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        response_format,
        stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI Error:', response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Exception:', error);
    return res.status(500).json({ 
      error: 'Proxy Internal Server Error', 
      details: error.message 
    });
  }
}
