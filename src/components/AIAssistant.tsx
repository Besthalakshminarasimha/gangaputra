import { useState } from "react";
import { MessageCircle, Send, X, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your aqua farming assistant. I can help you with farm management, calculations, product recommendations, and answer any questions you have. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand your query. Let me help you with that. This is a demo response - in the full implementation, this would connect to an AI service for intelligent responses.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 h-96 z-40 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Aqua Assistant</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.isBot ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-lg text-sm",
                    msg.isBot
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1"
              />
              <Button size="sm" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIAssistant;