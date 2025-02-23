import { encryptMessage, decryptMessage } from './security';

type Provider = 'deepseek' | 'openai' | 'anthropic';

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

const HEADERS = {
  deepseek: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }),
  openai: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }),
  anthropic: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  })
};

const formatRequestBody = (provider: Provider, content: string) => {
  switch (provider) {
    case 'anthropic':
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content }],
        max_tokens: 1000
      };
    default:
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content }],
        temperature: 0.7
      };
  }
};

const parseResponse = async (provider: Provider, response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  switch (provider) {
    case 'anthropic':
      return data.content[0].text;
    default:
      return data.choices[0].message.content;
  }
};

export const sendChatMessage = async (
  message: string,
  apiKey: string,
  provider: Provider
): Promise<string> => {
  try {
    console.log(`Sending message to ${provider} API...`);
    
    let response;
    
    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }]
        })
      });
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-2',
          messages: [{ role: 'user', content: message }]
        })
      });
    } else {
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }]
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (provider === 'anthropic') {
      return data.content[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error(`${provider} API Error:`, error);
    throw error;
  }
}; 