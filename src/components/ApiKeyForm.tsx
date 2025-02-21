import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { validateApiKey } from '../utils/openai';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { setSecureApiKey, checkRateLimit } from '../utils/security';

interface ApiKeyFormProps {
  provider: 'openai' | 'anthropic' | 'deepseek';
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ provider }) => {
  const [inputKey, setInputKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setApiKey } = useApiKey();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Rate limit kontrolü
      if (!checkRateLimit(provider)) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çok fazla istek gönderildi. Lütfen bir süre bekleyin.",
        });
        return;
      }

      const isValid = await validateApiKey(inputKey, provider);
      if (isValid) {
        // API key'i güvenli bir şekilde sakla
        setSecureApiKey(provider, inputKey);
        setApiKey(inputKey);
        
        toast({
          title: "Başarılı!",
          description: "API anahtarı güvenli bir şekilde kaydedildi.",
        });
        
        // Input alanını temizle
        setInputKey('');
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Geçersiz API anahtarı. Lütfen kontrol edip tekrar deneyin.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "API anahtarı doğrulanırken bir hata oluştu.",
      });
      console.error('API key validation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder={`${provider.toUpperCase()} API Anahtarını Girin`}
          disabled={isLoading}
          autoComplete="off"
        />
        <p className="text-sm text-gray-500">
          {provider === 'openai' && 'sk-... ile başlayan API anahtarınızı girin'}
          {provider === 'anthropic' && 'sk-ant-... ile başlayan API anahtarınızı girin'}
          {provider === 'deepseek' && 'Deepseek API anahtarınızı girin'}
        </p>
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !inputKey.trim()}
      >
        {isLoading ? "Doğrulanıyor..." : "API Anahtarını Kaydet"}
      </Button>
    </form>
  );
}; 