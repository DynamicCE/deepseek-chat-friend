import OpenAI from 'openai';

export const validateApiKey = async (apiKey: string, provider: string): Promise<boolean> => {
  try {
    let response;
    
    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        break;
        
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        break;
        
      case 'deepseek':
        if (!apiKey || apiKey.trim() === '') {
          return false;
        }
        return true;
        break;
    }

    return response?.ok ?? false;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}; 