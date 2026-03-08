import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  currentUserId: string;
  receiverId: string;
  receiverName: string;
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const InAppChat = ({ currentUserId, receiverId, receiverName, onBack }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);

    // Mark as read
    await supabase.from("messages").update({ is_read: true } as any)
      .eq("sender_id", receiverId).eq("receiver_id", currentUserId).eq("is_read", false);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel(`chat-${currentUserId}-${receiverId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === currentUserId && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === currentUserId)) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id === receiverId) {
            supabase.from("messages").update({ is_read: true } as any).eq("id", msg.id);
          }
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, receiverId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: input.trim(),
    } as any);
    setInput("");
    setSending(false);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader className="py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(receiverName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">{receiverName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              msg.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              <p>{msg.content}</p>
              <p className={`text-[10px] mt-0.5 ${msg.sender_id === currentUserId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {format(new Date(msg.created_at), "HH:mm")}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
      <div className="p-3 border-t flex gap-2 flex-shrink-0">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..."
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }} />
        <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default InAppChat;
