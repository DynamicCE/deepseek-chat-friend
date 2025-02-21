import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { ApiKeyForm } from '../components/ApiKeyForm';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendChatMessage } from '../utils/chat';

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_KEY_STORAGE_KEY = "deepseek-api-key";

const Index = () => {
  const { apiKey } = useApiKey();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState('openai');

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      toast({
        title: "API Anahtarı kaydedildi",
        description: "Artık sohbete başlayabilirsiniz.",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage, apiKey, selectedProvider);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu. Lütfen API anahtarınızı kontrol edin.",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
  };

  if (!apiKey) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-3xl mx-auto mt-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">AI Chat Uygulaması</h1>
            <p className="text-gray-600 mt-2">Başlamak için bir AI servisi seçin ve API anahtarınızı girin</p>
          </div>

          <Tabs defaultValue="openai" className="w-full" onValueChange={handleProviderSelect}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
              <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
            </TabsList>

            <TabsContent value="openai">
              <Card>
                <CardHeader>
                  <CardTitle>OpenAI API</CardTitle>
                  <CardDescription>
                    OpenAI'nin güçlü dil modellerini kullanın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiKeyForm provider="openai" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anthropic">
              <Card>
                <CardHeader>
                  <CardTitle>Anthropic API</CardTitle>
                  <CardDescription>
                    Anthropic'in AI modellerini kullanın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiKeyForm provider="anthropic" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deepseek">
              <Card>
                <CardHeader>
                  <CardTitle>DeepSeek API</CardTitle>
                  <CardDescription>
                    DeepSeek'in AI modellerini kullanın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiKeyForm provider="deepseek" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col max-w-4xl mx-auto animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-semibold">DeepSeek Chat</h1>
      </header>

      <div
        ref={chatContainerRef}
        className="chat-container flex-1 overflow-y-auto space-y-4 mb-4 rounded-lg bg-chat-100 p-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 min-h-[50px] max-h-[200px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-8"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default Index;
