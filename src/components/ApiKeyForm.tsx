import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { validateApiKey } from '@/utils/chat';
import { setSecureApiKey } from '@/utils/security';

interface ApiKeyFormProps {
  provider: string;
  onSubmit: (apiKey: string) => void;
  onCancel: () => void;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ provider, onSubmit, onCancel }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "API anahtarı boş olamaz."
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage('API anahtarı doğrulanıyor...');

    try {
      // API key'i test et
      const validationResult = await validateApiKey(
        provider.toLowerCase() as 'openrouter' | 'openai' | 'anthropic',
        apiKey
      );

      if (!validationResult.success) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: validationResult.message
        });
        setStatusMessage('');
        setIsLoading(false);
        return;
      }

      setStatusMessage('API anahtarı kaydediliyor...');
      
      // API key'i kaydet
      const saveResult = await setSecureApiKey(provider, apiKey);
      
      if (!saveResult.success) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: saveResult.message
        });
        setStatusMessage('');
        setIsLoading(false);
        return;
      }

      // Başarılı mesajını göster
      toast({
        title: "Başarılı",
        description: saveResult.message
      });

      // Form başarılı olduğunda
      onSubmit(apiKey);
      
      // Kısa bir gecikme ile modal'ı kapat (kullanıcının başarı mesajını görmesi için)
      setTimeout(() => {
        onCancel(); // Modal'ı kapat
      }, 500);
      
    } catch (error) {
      console.error('API key validation error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "API anahtarı doğrulanırken beklenmeyen bir hata oluştu."
      });
    } finally {
      setStatusMessage('');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        placeholder={`${provider} API Anahtarı`}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full bg-[#1C1C1E] text-white placeholder-gray-500 border-none rounded-lg p-3 text-sm"
      />
      
      {statusMessage && (
        <div className="text-sm text-blue-400 animate-pulse">
          {statusMessage}
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isLoading || !apiKey}
          className="px-4 py-2 bg-[#4B4BF7] text-white rounded-lg text-sm flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? 'Doğrulanıyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}; 