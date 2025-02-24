import { NextApiRequest, NextApiResponse } from 'next';

const API_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages'
};

const MODELS = {
  deepseek: 'deepseek-chat',
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-2'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, provider } = req.body;

    if (!message || !provider) {
      return res.status(400).json({ error: 'Message and provider are required' });
    }

    // API key'leri environment variables'dan al
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(API_ENDPOINTS[provider], {
      method: 'POST',
      headers: getHeaders(provider, apiKey),
      body: JSON.stringify(getRequestBody(provider, message))
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`${provider} API Error:`, error);
      throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = getResponseContent(provider, data);

    res.status(200).json({ content });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

function getApiKey(provider: string): string | undefined {
  switch (provider) {
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}

function getHeaders(provider: string, apiKey: string) {
  switch (provider) {
    case 'anthropic':
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
    default:
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
  }
}

function getRequestBody(provider: string, message: string) {
  switch (provider) {
    case 'anthropic':
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      };
    default:
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      };
  }
}

function getResponseContent(provider: string, data: any): string {
  switch (provider) {
    case 'anthropic':
      return data.content[0].text;
    default:
      return data.choices[0].message.content;
  }
} 