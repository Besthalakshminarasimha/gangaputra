import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { computeFarmScore } from "@/lib/farmScore";

type Score = ReturnType<typeof computeFarmScore>;

const FarmScoreCard = () => {
  const { user } = useAuth();
  const [score, setScore] = useState<Score | null>(null);

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    Promise.all([
      supabase.from("ponds").select("id, pond_name, species, stocking_date, area_acres").eq("user_id", user.id),
      supabase.from("water_quality_logs").select("pond_id, recorded_at, ph, dissolved_oxygen, ammonia, temperature").eq("user_id", user.id).gte("recorded_at", since),
      supabase.from("daily_farm_logs").select("pond_id, log_date, feed_quantity, mortality_count").eq("user_id", user.id).gte("log_date", since.slice(0, 10)),
      supabase.from("health_reports").select("created_at").eq("user_id", user.id).gte("created_at", since),
    ]).then(([p, w, l, h]) => {
      setScore(computeFarmScore(p.data ?? [], w.data ?? [], l.data ?? [], h.data ?? []));
    });
  }, [user]);

  if (!score) return null;
  const variant = score.total >= 60 ? "secondary" : "destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Gauge className="h-5 w-5" />Farm Score</span>
          <Badge variant={variant}>{score.total}/100 · {score.grade}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Calculated only from your pond, water, feed and health records. Missing records score zero.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {score.factors.map((f) => (
          <div key={f.key} className="space-y-1">
            <div className="flex justify-between text-sm font-medium"><span>{f.label}</span><span>{f.points}/{f.max}</span></div>
            <Progress value={(f.points / f.max) * 100} />
            <ul className="text-xs text-muted-foreground">
              {f.reasons.map((r) => <li key={r}>• {r}</li>)}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FarmScoreCard;
