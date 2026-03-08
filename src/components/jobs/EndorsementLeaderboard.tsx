import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ThumbsUp, Trophy } from "lucide-react";

interface Props {
  onSelectProfile: (profile: any) => void;
}

const EndorsementLeaderboard = ({ onSelectProfile }: Props) => {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["endorsement-leaderboard"],
    queryFn: async () => {
      // Get all endorsements
      const { data: endorsements } = await supabase.from("skill_endorsements").select("job_profile_id");
      if (!endorsements || endorsements.length === 0) return [];

      // Count per profile
      const countMap = new Map<string, number>();
      endorsements.forEach((e: any) => {
        countMap.set(e.job_profile_id, (countMap.get(e.job_profile_id) || 0) + 1);
      });

      // Get top 10
      const topIds = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("job_profiles")
        .select("*")
        .in("id", topIds)
        .eq("is_active", true);

      return (profiles || [])
        .map((p: any) => ({ ...p, endorsement_count: countMap.get(p.id) || 0 }))
        .sort((a: any, b: any) => b.endorsement_count - a.endorsement_count);
    },
  });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (isLoading) return null;
  if (leaderboard.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" /> Top Endorsed Workers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.map((p: any, i: number) => (
          <div key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => onSelectProfile(p)}>
            <span className="w-6 text-center font-bold text-sm">{medals[i] || `#${i + 1}`}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.profile_image_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate flex items-center gap-1">
                {p.full_name}
                {p.is_verified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
              </p>
              <p className="text-xs text-muted-foreground">{p.district}, {p.state}</p>
            </div>
            <Badge variant="secondary" className="text-xs gap-1">
              <ThumbsUp className="h-3 w-3" /> {p.endorsement_count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EndorsementLeaderboard;
