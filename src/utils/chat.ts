import { checkRateLimit } from './security';

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sendChatMessage = async (
  message: string, 
  apiKey: string, 
  provider: string
): Promise<string> => {
  try {
    // Rate limit kontrolü
    if (!checkRateLimit(provider)) {
      throw new Error('Rate limit aşıldı. Lütfen bir süre bekleyin.');
    }

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
            messages: [{ role: 'user', content: message }],
          }),
        });
        const openaiData = await response.json();
        return openaiData.choices[0].message.content;

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            messages: [{ role: 'user', content: message }],
          }),
        });
        const anthropicData = await response.json();
        return anthropicData.content;

      case 'deepseek':
        // DeepSeek için doğru endpoint ve istek formatını kullanacağız
        // Not: Bu bilgileri DeepSeek'in API dokümantasyonundan almalısınız
        return "DeepSeek API henüz entegre edilmedi.";

      default:
        throw new Error('Desteklenmeyen provider');
    }
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}; 