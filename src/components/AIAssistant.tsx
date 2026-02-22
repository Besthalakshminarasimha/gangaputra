import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, X, Mic, MicOff, Volume2, VolumeX, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type Language = "en" | "te" | "ta" | "kn";

const LANG_CONFIG: Record<Language, { label: string; flag: string; sttCode: string; ttsCode: string }> = {
  en: { label: "English", flag: "🇬🇧", sttCode: "en-IN", ttsCode: "en" },
  te: { label: "తెలుగు", flag: "🇮🇳", sttCode: "te-IN", ttsCode: "te" },
  ta: { label: "தமிழ்", flag: "🇮🇳", sttCode: "ta-IN", ttsCode: "ta" },
  kn: { label: "ಕನ್ನಡ", flag: "🇮🇳", sttCode: "kn-IN", ttsCode: "kn" },
};

const AIAssistant = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your aqua farming assistant. I can help you with farm management, calculations, product recommendations, and answer any questions you have. Tap the mic to speak! 🎙️",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Speech Recognition (STT) ---
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition is not supported in this browser.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_CONFIG[language].sttCode;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
      if (e.error !== "aborted") {
        toast({ title: "Voice error", description: `Could not recognize speech: ${e.error}`, variant: "destructive" });
      }
    };

    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setMessage(finalTranscript || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        setMessage(finalTranscript.trim());
        // Auto-send after voice input
        setTimeout(() => {
          const btn = document.getElementById("ai-chat-send-btn");
          btn?.click();
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // --- Text-to-Speech (TTS) ---
  const speakText = useCallback(async (text: string) => {
    if (!text.trim() || isSpeaking) return;

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: text.slice(0, 500), // Limit for TTS
            language: LANG_CONFIG[language].ttsCode,
          }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const data = await response.json();
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  }, [language, isSpeaking]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // --- Send message ---
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.isBot ? "assistant" : "user",
              content: msg.text,
            })),
            { role: "user", content: currentMessage },
          ],
          language,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to get AI response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const botMessageId = (Date.now() + 1).toString();
      let accumulatedText = "";

      setMessages(prev => [...prev, { id: botMessageId, text: "", isBot: true, timestamp: new Date() }]);

      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulatedText += content;
              setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Auto-speak the response
      if (autoSpeak && accumulatedText.trim()) {
        speakText(accumulatedText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        isBot: true,
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-[340px] h-[440px] z-40 shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Aqua Voice Assistant</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isListening ? (
                    <span className="text-destructive animate-pulse">● Listening...</span>
                  ) : isSpeaking ? (
                    <span className="text-primary animate-pulse">🔊 Speaking...</span>
                  ) : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAutoSpeak(!autoSpeak)} title={autoSpeak ? "Mute auto-speak" : "Enable auto-speak"}>
                {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="px-3 py-1.5 border-b shrink-0">
            <Select value={language} onValueChange={v => setLanguage(v as Language)}>
              <SelectTrigger className="h-7 text-xs">
                <Globe className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANG_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {cfg.flag} {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.isBot ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "max-w-[85%] p-2.5 rounded-lg text-xs leading-relaxed",
                  msg.isBot ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                )}>
                  {msg.text}
                  {msg.isBot && msg.text && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="ml-1.5 inline-flex opacity-60 hover:opacity-100 transition-opacity"
                      title="Listen"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t shrink-0">
            <div className="flex gap-1.5">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                className="flex-1 h-9 text-xs"
                disabled={isListening}
              />
              <Button id="ai-chat-send-btn" size="sm" className="h-9 w-9 p-0" onClick={sendMessage} disabled={!message.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                className={cn("h-9 w-9 p-0", isListening && "animate-pulse")}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
              {isSpeaking && (
                <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={stopSpeaking}>
                  <VolumeX className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIAssistant;
