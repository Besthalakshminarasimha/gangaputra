import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FarmScoreCard from "@/components/farm/FarmScoreCard";

type Farm = { id: string; farm_name: string; location: string; passport_number: string | null; verification_status: string };
type Pond = { id: string; farm_id: string; pond_name: string; species: string | null; status: string; stocking_date: string | null; area_acres: number | null; verification_status: string };
type Water = { id: string; pond_id: string; recorded_at: string; ph: number | null; dissolved_oxygen: number | null; temperature: number | null; salinity: number | null };
type Log = { id: string; pond_id: string | null; log_date: string; feed_quantity: number | null; mortality_count: number | null; pond_observation: string | null };

const FarmPassport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [water, setWater] = useState<Water[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("farms").select("id, farm_name, location, passport_number, verification_status").eq("user_id", user.id).order("created_at"),
      supabase.from("ponds").select("id, farm_id, pond_name, species, status, stocking_date, area_acres, verification_status").eq("user_id", user.id).order("created_at"),
      supabase.from("water_quality_logs").select("id, pond_id, recorded_at, ph, dissolved_oxygen, temperature, salinity").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(200),
      supabase.from("daily_farm_logs").select("id, pond_id, log_date, feed_quantity, mortality_count, pond_observation").eq("user_id", user.id).order("log_date", { ascending: false }).limit(200),
    ]).then(([f, p, w, l]) => {
      setFarms((f.data ?? []) as Farm[]);
      setPonds((p.data ?? []) as Pond[]);
      setWater((w.data ?? []) as Water[]);
      setLogs((l.data ?? []) as Log[]);
      setLoading(false);
    });
  }, [user]);

  const shareUrl = (n: string) => `${window.location.origin}/passport/view/${n}`;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-primary-foreground">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><QrCode className="h-6 w-6" />Ganga Farm Passport</h1>
        <p className="text-sm opacity-90">Your farm identity with every pond's recorded history.</p>
      </div>
      <div className="space-y-6 p-4">
        <FarmScoreCard />
        {loading ? <p className="text-muted-foreground">Loading…</p> : farms.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Add a farm from the Home dashboard to get your GF-AP passport number.</CardContent></Card>
        ) : farms.map((farm) => (
          <Card key={farm.id}>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{farm.farm_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{farm.location}</p>
                  <p className="mt-2 font-mono text-lg font-bold">{farm.passport_number}</p>
                  <Badge variant={farm.verification_status === "verified" ? "secondary" : "outline"} className="mt-1">{farm.verification_status}</Badge>
                </div>
                {farm.passport_number && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg bg-card p-2 ring-1 ring-border"><QRCodeSVG value={shareUrl(farm.passport_number)} size={128} /></div>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl(farm.passport_number!)); toast({ title: "Passport link copied" }); }}>
                      <Copy className="mr-1 h-3 w-3" />Copy link
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ponds.filter((p) => p.farm_id === farm.id).length === 0 && <p className="text-sm text-muted-foreground">No ponds recorded for this farm.</p>}
              {ponds.filter((p) => p.farm_id === farm.id).map((pond) => {
                const pw = water.filter((w) => w.pond_id === pond.id);
                const pl = logs.filter((l) => l.pond_id === pond.id);
                const totalFeed = pl.reduce((s, l) => s + (Number(l.feed_quantity) || 0), 0);
                const totalMort = pl.reduce((s, l) => s + (l.mortality_count ?? 0), 0);
                return (
                  <div key={pond.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{pond.pond_name}</h3>
                      <Badge variant="outline">{pond.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pond.species || "Species not recorded"} · {pond.area_acres ? `${pond.area_acres} acres` : "Area not recorded"} · {pond.stocking_date ? `Stocked ${new Date(pond.stocking_date).toLocaleDateString("en-IN")}` : "Stocking date not recorded"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div><p className="text-xs text-muted-foreground">Water logs</p><p className="font-bold">{pw.length}</p></div>
                      <div><p className="text-xs text-muted-foreground">Daily logs</p><p className="font-bold">{pl.length}</p></div>
                      <div><p className="text-xs text-muted-foreground">Feed logged</p><p className="font-bold">{totalFeed} kg</p></div>
                      <div><p className="text-xs text-muted-foreground">Mortality</p><p className="font-bold">{totalMort}</p></div>
                    </div>
                    {pw[0] && <p className="mt-2 text-xs text-muted-foreground">Last water test {new Date(pw[0].recorded_at).toLocaleDateString("en-IN")}: pH {pw[0].ph ?? "—"}, DO {pw[0].dissolved_oxygen ?? "—"} mg/L, temp {pw[0].temperature ?? "—"}°C, salinity {pw[0].salinity ?? "—"} ppt</p>}
                    {pl.slice(0, 3).map((l) => (
                      <p key={l.id} className="text-xs text-muted-foreground">{l.log_date}: feed {l.feed_quantity ?? "—"} kg, mortality {l.mortality_count ?? "—"}{l.pond_observation ? ` · ${l.pond_observation}` : ""}</p>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FarmPassport;
