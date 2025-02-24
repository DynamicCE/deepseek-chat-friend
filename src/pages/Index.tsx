import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useProviderContext } from '@/contexts/ProviderContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { sendChatMessage } from '@/utils/chat';
import { ApiKeyForm } from '@/components/ApiKeyForm';

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { provider, setProvider } = useProviderContext();
  const { apiKey, setApiKey } = useApiKey();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Event handler'ları için useCallback
  const handleProviderChange = useCallback((newProvider: string) => {
    setProvider(newProvider);
    setError(null);
  }, [setProvider]);

  const handleApiKeySubmit = useCallback(async (key: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!key) {
        setError('API anahtarı boş olamaz');
        return;
      }

      await sendChatMessage(
        'Test message',
        key,
        provider.toLowerCase() as 'deepseek' | 'openai' | 'anthropic'
      );

      await setApiKey(key);
      setShowApiKeyModal(false);
      toast({
        title: 'Başarılı',
        description: `${provider} API anahtarı doğrulandı! Oturum boyunca kullanabilirsiniz.`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'API error');
    } finally {
      setIsLoading(false);
    }
  }, [provider, setApiKey, toast]);

  const handleMessageSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textareaRef.current?.value.trim() || !apiKey) return;

    const message = textareaRef.current.value;
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    textareaRef.current.value = '';

    try {
      setIsLoading(true);
      const response = await sendChatMessage(
        message,
        apiKey,
        provider.toLowerCase() as 'deepseek' | 'openai' | 'anthropic'
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, provider, toast]);

  // Mesaj listesi için intersection observer
  const messageEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (messageEndRef.current && typeof messageEndRef.current.scrollIntoView === 'function') {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Mesajlar görünür olduğunda yapılacak işlemler
        }
      },
      { threshold: 0.5 }
    );

    if (messageEndRef.current) {
      observerRef.current.observe(messageEndRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessageSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-4">
      <div className="w-full max-w-[800px]">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2E] rounded-full text-xs text-gray-300 hover:text-white transition-all animate-pulse hover:animate-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-key w-3.5 h-3.5"
            >
              <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
              <path d="m21 2-9.6 9.6" />
              <circle cx="7.5" cy="15.5" r="5.5" />
            </svg>
            {provider} API Anahtarı Ekle
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => handleProviderChange('DeepSeek')}
            className={`p-2 rounded-lg transition-all ${
              provider === 'DeepSeek' ? 'bg-[#2C2C2E] scale-110' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <img src="/deepseek-color.svg" alt="DeepSeek" className="w-8 h-8" />
          </button>
          <button
            onClick={() => handleProviderChange('ChatGPT')}
            className={`p-2 rounded-lg transition-all ${
              provider === 'ChatGPT' ? 'bg-[#2C2C2E] scale-110' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <img src="/openailogo.jpg" alt="ChatGPT" className="w-8 h-8" />
          </button>
          <button
            onClick={() => handleProviderChange('Claude')}
            className={`p-2 rounded-lg transition-all ${
              provider === 'Claude' ? 'bg-[#2C2C2E] scale-110' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <img src="/claudelogo.png" alt="Claude" className="w-8 h-8" />
          </button>
        </div>

        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2C2C2E] rounded-xl p-6 w-full max-w-md" role="dialog">
              <h2 className="text-lg text-white mb-2">{provider} API Anahtarı Girin</h2>
              <p className="text-sm text-gray-400 mb-4">
                API anahtarınız sadece bu oturum için geçici olarak kullanılacak ve hiçbir yerde saklanmayacaktır.
              </p>
              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <ApiKeyForm
                provider={provider}
                onSubmit={handleApiKeySubmit}
                onCancel={() => setShowApiKeyModal(false)}
              />
            </div>
          </div>
        )}

        <div className="text-center mb-6 flex items-center justify-center gap-3">
          <img src={`/${provider.toLowerCase()}-color.svg`} alt={provider} className="w-10 h-10" />
          <h1 className="text-xl text-white">
            Merhaba, ben {provider}.
          </h1>
        </div>

        <p className="text-sm text-gray-400 text-center mb-6">
          Size bugün nasıl yardımcı olabilirim?
        </p>

        <div className="bg-[#2C2C2E] rounded-xl p-3">
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
                      : 'bg-[#3C3C3E] text-gray-300'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={handleMessageSubmit} className="relative">
            <textarea
              ref={textareaRef}
              placeholder={`${provider}'a mesaj gönder`}
              className="w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none min-h-[40px] max-h-[80px] p-1 text-sm"
              onKeyDown={handleTextareaKeyDown}
            />
          </form>

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs
                bg-[#3C3C3E] text-gray-300 hover:text-white hover:bg-[#4C4C4E]">
                <div className="w-3.5 h-3.5 relative">
                  <div className="absolute inset-0 border-[1.5px] border-current rounded-sm"></div>
                  <div className="absolute inset-[2px] border-[1.5px] border-current rounded-sm"></div>
                </div>
                DeepThink (R1)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs
                bg-[#3C3C3E] text-gray-300 hover:text-white hover:bg-[#4C4C4E]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-globe w-3.5 h-3.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                Ara
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#3C3C3E] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-paperclip w-3.5 h-3.5"
                >
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleMessageSubmit}
                disabled={!apiKey || isLoading}
                data-testid="send-button"
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#3C3C3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-up w-3.5 h-3.5"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
