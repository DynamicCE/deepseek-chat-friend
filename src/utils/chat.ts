import { encryptMessage, decryptMessage } from './security';

type Provider = 'openrouter' | 'openai' | 'anthropic';

const API_ENDPOINTS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages'
};

const MODELS = {
  openrouter: 'deepseek/deepseek-r1:free',
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
export const validateApiKey = async (provider: Provider, apiKey: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Validating ${provider} API key...`);
    
    // Daha basit bir test isteği
    const requestBody = {
      model: MODELS[provider],
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1, // Minimum token sayısı
      temperature: 0.1
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout (10 yerine)
    
    const options = {
      method: 'POST',
      headers: HEADERS[provider](apiKey),
      body: JSON.stringify(requestBody),
      mode: 'cors' as RequestMode,
      cache: 'no-cache' as RequestCache,
      signal: controller.signal
    };

    console.log('Sending validation request to:', API_ENDPOINTS[provider]);
    const response = await fetch(API_ENDPOINTS[provider], options);
    clearTimeout(timeoutId);

    console.log('Validation response status:', response.status);
    
    // Başarılı yanıt - hızlı dönüş
    if (response.status === 200) {
      console.log('API key validation successful');
      return {
        success: true,
        message: 'API anahtarı doğrulandı ve kaydedildi. Bu oturum boyunca kullanabilirsiniz.'
      };
    }
    
    // Hata durumunda detaylı bilgi
    const responseData = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      error: responseData
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'API anahtarı geçersiz. Lütfen doğru anahtarı girdiğinizden emin olun.'
      };
    }

    return {
      success: false,
      message: responseData.error?.message || 'API anahtarı doğrulanırken bir hata oluştu.'
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('API key validation timed out');
      return {
        success: false,
        message: 'Doğrulama zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'
      };
    }

    console.error('API Key Validation Error:', {
      message: error?.message || 'Bilinmeyen hata',
      stack: error?.stack,
      provider,
      endpoint: API_ENDPOINTS[provider]
    });

    if (error.message.includes('ECONNRESET')) {
      return {
        success: false,
        message: 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'
      };
    }

    return {
      success: false,
      message: 'API anahtarı doğrulanamadı. Lütfen tekrar deneyin.'
    };
  }
};

const parseResponse = async (provider: Provider, response: Response) => {
  try {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Parsing response data:', JSON.stringify(data, null, 2));
    
    // Hata kontrolü ekleyelim
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid API response format:', data);
      throw new Error('API geçersiz yanıt döndü');
    }

    const messageContent = data.choices[0].message?.content;
    
    if (!messageContent) {
      console.error('No content in API response:', data);
      throw new Error('API yanıtında içerik bulunamadı');
    }

    if (provider === 'openrouter') {
      // Markdown formatını düzenle
      const sections = messageContent.split('\n\n');
      const formattedSections = sections.map((section: string) => {
        // Başlıkları düzenle
        if (section.startsWith('#')) {
          return `\n${section}\n`;
        }
        // Madde işaretlerini düzenle
        if (section.includes('- ')) {
          return section.split('\n').map((line: string) => 
            line.trim().startsWith('-') ? line : `- ${line}`
          ).join('\n');
        }
        // Kod bloklarını düzenle
        if (section.includes('```')) {
          return `\n${section}\n`;
        }
        // Normal metni düzenle
        return section.split('\n').map((line: string) => `${line}\n`).join('');
      });

      return formattedSections.join('\n');
    }

    return messageContent;
  } catch (error: any) {
    console.error('Error parsing response:', error);
    throw new Error(`Yanıt işlenirken bir hata oluştu: ${error.message}`);
  }
};

export const sendChatMessage = async (
  message: string,
  apiKey: string,
  provider: Provider
): Promise<string> => {
  try {
    console.log(`Sending message to ${provider} API...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 30 yerine 20 saniye timeout
    
    // Daha basit bir istek gövdesi
    const requestBody = {
      model: MODELS[provider],
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000,
      temperature: 0.7
    };
    
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const headers = HEADERS[provider](apiKey);
    console.log('Request Headers:', JSON.stringify(headers, null, 2));
    
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      mode: 'cors' as RequestMode,
      cache: 'no-cache' as RequestCache,
      signal: controller.signal
    };

    console.log('Sending request to:', API_ENDPOINTS[provider]);
    const response = await fetch(API_ENDPOINTS[provider], options);
    clearTimeout(timeoutId);
    
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API yanıt vermedi' }));
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: API_ENDPOINTS[provider],
        requestBody,
        headers
      });
      
      // Daha anlaşılır hata mesajları
      if (response.status === 401 || response.status === 403) {
        throw new Error('API anahtarı geçersiz veya yetkisiz erişim. Lütfen API anahtarınızı kontrol edin.');
      } else if (response.status === 429) {
        throw new Error('API istek limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (response.status === 404) {
        throw new Error('API endpoint bulunamadı. Lütfen API sağlayıcınızı kontrol edin.');
      }
      
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Response Data:', JSON.stringify(responseData, null, 2));

    // Doğrudan responseData kullan, yeni bir Response oluşturma
    return await parseResponse(provider, new Response(JSON.stringify(responseData), {
      status: 200,
      statusText: 'OK'
    }));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    console.error(`${provider} API Error:`, {
      message: error?.message || 'Bilinmeyen hata',
      stack: error?.stack,
      provider,
      endpoint: API_ENDPOINTS[provider]
    });
    throw new Error(`Mesaj gönderilirken bir hata oluştu: ${error.message}`);
  }
}; 