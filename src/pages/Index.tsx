
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_KEY_STORAGE_KEY = "deepseek-api-key";

export default function Index() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error("API isteği başarısız oldu");
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
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

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-up">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">DeepSeek Chat</h2>
            <p className="mt-2 text-sm text-gray-600">
              Başlamak için DeepSeek API anahtarınızı girin
            </p>
          </div>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="API Anahtarı"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="block w-full"
            />
            <Button type="submit" className="w-full">
              Başla
            </Button>
          </form>
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
}
