import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PassportPond = { pond_name: string; species: string | null; status: string; stocking_date: string | null; verification_status: string; water_logs: number; daily_logs: number; last_water: { recorded_at: string; ph: number | null; dissolved_oxygen: number | null } | null };
type Passport = { passport_number: string; farm_name: string; location: string; verification_status: string; created_at: string; ponds: PassportPond[] };

const PublicFarmPassport = () => {
  const { number } = useParams();
  const [data, setData] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_farm_passport", { _number: number ?? "" }).then(({ data }) => {
      setData((data as unknown as Passport) ?? null);
      setLoading(false);
    });
  }, [number]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading passport…</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Passport not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ganga Farm Passport</p>
          <CardTitle className="font-mono">{data.passport_number}</CardTitle>
          <p className="text-sm">{data.farm_name} · {data.location}</p>
          <Badge variant={data.verification_status === "verified" ? "secondary" : "outline"} className="w-fit">{data.verification_status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.ponds.length === 0 && <p className="text-sm text-muted-foreground">No ponds recorded.</p>}
          {data.ponds.map((p) => (
            <div key={p.pond_name} className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between"><span className="font-semibold">{p.pond_name}</span><Badge variant="outline">{p.verification_status}</Badge></div>
              <p className="text-xs text-muted-foreground">{p.species || "Species not recorded"} · {p.status} · {p.water_logs} water logs · {p.daily_logs} daily logs</p>
              {p.last_water && <p className="text-xs text-muted-foreground">Last test {new Date(p.last_water.recorded_at).toLocaleDateString("en-IN")}: pH {p.last_water.ph ?? "—"}, DO {p.last_water.dissolved_oxygen ?? "—"} mg/L</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicFarmPassport;
