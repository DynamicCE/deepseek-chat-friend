import { encryptMessage, decryptMessage } from './security';

type Provider = 'openrouter' | 'openai' | 'anthropic';

const API_ENDPOINTS = {
  openrouter: '/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages'
};

const MODELS = {
  openrouter: 'deepseek/deepseek-33b-chat',
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-2'
};

const HEADERS = {
  openrouter: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${encodeURIComponent(apiKey.trim())}`,
    'HTTP-Referer': encodeURIComponent('https://github.com/DynamicCE/deepseek-chat-friend'),
    'X-Title': encodeURIComponent('DeepSeek Chat Friend')
  }),
  openai: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${encodeURIComponent(apiKey.trim())}`
  }),
  anthropic: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'x-api-key': encodeURIComponent(apiKey.trim()),
    'anthropic-version': '2023-06-01'
  })
};

// API key doğrulama için test isteği
export const validateApiKey = async (provider: Provider, apiKey: string): Promise<boolean> => {
  try {
    console.log(`Validating ${provider} API key...`);
    
    const testMessage = "Test message";
    const requestBody = formatRequestBody(provider, testMessage);
    
    const headers = new Headers();
    const headerObj = HEADERS[provider](apiKey);
    
    // Header'ları güvenli bir şekilde ekle
    Object.entries(headerObj).forEach(([key, value]) => {
      headers.append(key, value);
    });
    
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      mode: 'cors' as RequestMode,
      cache: 'no-cache' as RequestCache
    };

    console.log('Request Options:', {
      url: API_ENDPOINTS[provider],
      method: options.method,
      headers: Object.fromEntries(headers.entries()),
      body: requestBody
    });

    const response = await fetch(API_ENDPOINTS[provider], options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return false;
    }

    const responseData = await response.json();
    console.log('API Response Success:', responseData);
    return true;
  } catch (error: any) {
    console.error('API Key Validation Error:', {
      message: error?.message || 'Bilinmeyen hata',
      stack: error?.stack,
      provider,
      endpoint: API_ENDPOINTS[provider]
    });
    return false;
  }
};

const formatRequestBody = (provider: Provider, content: string) => {
  switch (provider) {
    case 'anthropic':
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content }],
        max_tokens: 1000
      };
    case 'openrouter':
      return {
        model: MODELS[provider],
        messages: [{ role: 'user', content }],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
        transforms: ["middle-out"],
        route: "fallback"
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
  return data.choices[0].message.content;
};

export const sendChatMessage = async (
  message: string,
  apiKey: string,
  provider: Provider
): Promise<string> => {
  try {
    console.log(`Sending message to ${provider} API...`);
    
    const options = {
      method: 'POST',
      headers: HEADERS[provider](apiKey),
      body: JSON.stringify(formatRequestBody(provider, message)),
      mode: 'cors' as RequestMode,
      cache: 'no-cache' as RequestCache
    };

    const response = await fetch(API_ENDPOINTS[provider], options);
    return await parseResponse(provider, response);
  } catch (error: any) {
    console.error(`${provider} API Error:`, {
      message: error?.message || 'Bilinmeyen hata',
      stack: error?.stack,
      provider,
      endpoint: API_ENDPOINTS[provider]
    });
    throw error;
  }
}; 