import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface Props {
  userId: string;
  onSelectChat: (partnerId: string, partnerName: string) => void;
}

const ChatList = ({ userId, onSelectChat }: Props) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      // Get all messages involving this user
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (!msgs) { setLoading(false); return; }

      // Group by partner
      const partnerMap = new Map<string, { msgs: any[]; unread: number }>();
      msgs.forEach((m: any) => {
        const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, { msgs: [], unread: 0 });
        const entry = partnerMap.get(partnerId)!;
        entry.msgs.push(m);
        if (m.receiver_id === userId && !m.is_read) entry.unread++;
      });

      // Get partner names from profiles
      const partnerIds = Array.from(partnerMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", partnerIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || "Unknown"]));

      // Also check job_profiles for names
      const { data: jobProfiles } = await supabase
        .from("job_profiles")
        .select("user_id, full_name")
        .in("user_id", partnerIds);
      (jobProfiles || []).forEach((jp: any) => {
        if (!profileMap.get(jp.user_id) || profileMap.get(jp.user_id) === "Unknown") {
          profileMap.set(jp.user_id, jp.full_name);
        }
      });

      const convs: Conversation[] = partnerIds.map(pid => {
        const entry = partnerMap.get(pid)!;
        const last = entry.msgs[0];
        return {
          partnerId: pid,
          partnerName: profileMap.get(pid) || "Unknown User",
          lastMessage: last.content,
          lastTime: last.created_at,
          unread: entry.unread,
        };
      });

      setConversations(convs);
      setLoading(false);
    };

    fetchConversations();
  }, [userId]);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return <p className="text-center text-muted-foreground py-8">Loading conversations...</p>;

  if (conversations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet. Message a worker from their profile!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map(c => (
        <Card key={c.partnerId} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSelectChat(c.partnerId, c.partnerName)}>
          <CardContent className="p-3 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(c.partnerName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{c.partnerName}</h4>
                <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(c.lastTime), "dd MMM")}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
            </div>
            {c.unread > 0 && <Badge className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">{c.unread}</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChatList;
