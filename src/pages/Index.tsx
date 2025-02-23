import React, { useState, useEffect } from 'react';
import { Loader2, Paperclip, ArrowUp, Globe, Key } from 'lucide-react';

type Provider = 'deepseek' | 'openai' | 'anthropic';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const providerInfo = {
  deepseek: {
    name: 'DeepSeek',
    logo: '/deepseek-color.svg',
  },
  openai: {
    name: 'ChatGPT',
    logo: '/openailogo.jpg',
  },
  anthropic: {
    name: 'Claude',
    logo: '/claudelogo.png',
  }
};

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('deepseek');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // WeakMap kullanarak API key'i daha güvenli saklayalım
  const apiKeyStorage = React.useRef(new WeakMap());
  const apiKeyToken = React.useRef<{}>();

  const setTempApiKey = (key: string | null) => {
    if (key) {
      apiKeyToken.current = {};
      apiKeyStorage.current.set(apiKeyToken.current, key);
    } else {
      apiKeyToken.current = undefined;
    }
  };

  const getTempApiKey = (): string | null => {
    if (!apiKeyToken.current) return null;
    return apiKeyStorage.current.get(apiKeyToken.current) || null;
  };

  // Otomatik temizleme için cleanup effect
  useEffect(() => {
    return () => {
      setTempApiKey(null);
      apiKeyStorage.current = new WeakMap();
    };
  }, []);

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const form = e.currentTarget as HTMLFormElement;
    const key = form.elements.namedItem('apiKey') as HTMLInputElement;
    const apiKeyValue = key.value.trim();
    
    if (!apiKeyValue) {
      setError('API anahtarı boş olamaz');
      return;
    }

    try {
      setIsLoading(true);
      await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: apiKeyValue,
          provider: selectedProvider
        })
      });
      
      setTempApiKey(apiKeyValue);
      form.reset(); // Form'u temizle
      setShowApiKeyModal(false);
      setSuccess(`${providerInfo[selectedProvider].name} API anahtarı doğrulandı! Oturum boyunca kullanabilirsiniz.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Validation error:', error);
      setError('API anahtarı geçersiz veya API servisine ulaşılamıyor. Lütfen kontrol edip tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          provider: selectedProvider
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API yanıt vermedi');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Provider değiştiğinde API key'i sıfırla
  useEffect(() => {
    setTempApiKey(null);
    setShowApiKeyModal(true);
  }, [selectedProvider]);

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-4">
      <div className="w-full max-w-[800px]">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-2 rounded-lg mb-4">
            {success}
          </div>
        )}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2E] rounded-full text-xs text-gray-300 hover:text-white transition-all animate-pulse hover:animate-none"
          >
            <Key className="w-3.5 h-3.5" />
            {providerInfo[selectedProvider].name} API Anahtarı Ekle
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          {(Object.entries(providerInfo) as [Provider, typeof providerInfo.deepseek][]).map(([provider, info]) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`p-2 rounded-lg transition-all ${
                selectedProvider === provider 
                  ? 'bg-[#2C2C2E] scale-110' 
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <img src={info.logo} alt={info.name} className="w-8 h-8" />
            </button>
          ))}
        </div>

        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2C2C2E] rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg text-white mb-2">
                {providerInfo[selectedProvider].name} API Anahtarı Girin
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                API anahtarınız sadece bu oturum için geçici olarak kullanılacak ve hiçbir yerde saklanmayacaktır.
              </p>
              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleApiKeySubmit}>
                <input
                  name="apiKey"
                  type="password"
                  defaultValue=""
                  placeholder={`${providerInfo[selectedProvider].name} API Anahtarı`}
                  className="w-full bg-[#1C1C1E] text-white placeholder-gray-500 border-none rounded-lg p-3 mb-4 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4B4BF7] text-white rounded-lg text-sm"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="text-center mb-6 flex items-center justify-center gap-3">
          <img src={providerInfo[selectedProvider].logo} alt={providerInfo[selectedProvider].name} className="w-10 h-10" />
          <h1 className="text-xl text-white">Merhaba, ben {providerInfo[selectedProvider].name}.</h1>
        </div>
        <p className="text-sm text-gray-400 text-center mb-6">Size bugün nasıl yardımcı olabilirim?</p>

        <div className="bg-[#2C2C2E] rounded-xl p-3">
          {/* Mesaj Geçmişi */}
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#4B4BF7] text-white'
                      : 'bg-[#3C3C3E] text-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#3C3C3E] rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>

          <form 
            onSubmit={handleSendMessage} 
            className="relative"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${providerInfo[selectedProvider].name}'a mesaj gönder`}
              className="w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none min-h-[40px] max-h-[80px] p-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </form>

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1.5">
              <button 
                onClick={() => setSelectedButton(selectedButton === 'deepthink' ? null : 'deepthink')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs
                  ${selectedButton === 'deepthink' 
                    ? 'bg-[#4B4BF7] text-white hover:bg-[#3939E9]' 
                    : 'bg-[#3C3C3E] text-gray-300 hover:text-white hover:bg-[#4C4C4E]'}`}
              >
                <div className="w-3.5 h-3.5 relative">
                  <div className="absolute inset-0 border-[1.5px] border-current rounded-sm"></div>
                  <div className="absolute inset-[2px] border-[1.5px] border-current rounded-sm"></div>
                </div>
                DeepThink (R1)
              </button>
              <button 
                onClick={() => setSelectedButton(selectedButton === 'search' ? null : 'search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs
                  ${selectedButton === 'search' 
                    ? 'bg-[#4B4BF7] text-white hover:bg-[#3939E9]' 
                    : 'bg-[#3C3C3E] text-gray-300 hover:text-white hover:bg-[#4C4C4E]'}`}
              >
                <Globe className="w-3.5 h-3.5" />
                Ara
              </button>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#3C3C3E] transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#3C3C3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
