import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { validateApiKey } from '@/utils/openai';
import { checkRateLimit, setSecureApiKey } from '@/utils/security';

interface ApiKeyFormProps {
  provider: string;
  onSubmit: (apiKey: string) => void;
  onCancel: () => void;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ provider, onSubmit, onCancel }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    if (!checkRateLimit(provider)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rate limit aşıldı. Lütfen daha sonra tekrar deneyin."
      });
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await validateApiKey(provider, apiKey);
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Geçersiz API anahtarı."
        });
        return;
      }

      await setSecureApiKey(provider, apiKey);
      toast({
        title: "Başarılı",
        description: `${provider} API anahtarı doğrulandı!`
      });
      onSubmit(apiKey);
    } catch (error) {
      console.error('API key validation error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "API anahtarı doğrulanırken bir hata oluştu."
      });
    } finally {
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
          className="px-4 py-2 bg-[#4B4BF7] text-white rounded-lg text-sm"
        >
          {isLoading ? 'Doğrulanıyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}; 