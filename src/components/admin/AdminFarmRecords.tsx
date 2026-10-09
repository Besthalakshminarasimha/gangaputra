import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Flag, Loader2, RefreshCw } from "lucide-react";

type Table = "farms" | "ponds" | "daily_farm_logs" | "water_quality_logs";
type Row = Record<string, any> & { id: string; verification_status: string };

const statusVariant = (s: string) => (s === "verified" ? "secondary" : s === "flagged" ? "destructive" : "outline");

const AdminFarmRecords = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Record<Table, Row[]>>({ farms: [], ponds: [], daily_farm_logs: [], water_quality_logs: [] });
  const [loading, setLoading] = useState(true);
  const [onlyUnverified, setOnlyUnverified] = useState(true);

  const load = async () => {
    setLoading(true);
    const [f, p, d, w] = await Promise.all([
      supabase.from("farms").select("id, farm_name, location, number_of_ponds, passport_share_token, verification_status, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("ponds").select("id, farm_id, pond_name, species, status, area_acres, stocking_date, verification_status, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("daily_farm_logs").select("id, pond_id, log_date, feed_quantity, mortality_count, pond_observation, verification_status").order("log_date", { ascending: false }).limit(300),
      supabase.from("water_quality_logs").select("id, pond_id, recorded_at, ph, dissolved_oxygen, temperature, salinity, ammonia, verification_status").order("recorded_at", { ascending: false }).limit(300),
    ]);
    const err = f.error || p.error || d.error || w.error;
    if (err) toast({ title: "Could not load farm records", description: err.message, variant: "destructive" });
    setData({ farms: (f.data ?? []) as Row[], ponds: (p.data ?? []) as Row[], daily_farm_logs: (d.data ?? []) as Row[], water_quality_logs: (w.data ?? []) as Row[] });
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setStatus = async (table: Table, id: string, status: string) => {
    const { error } = await supabase.from(table).update({ verification_status: status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setData((prev) => ({ ...prev, [table]: prev[table].map((r) => (r.id === id ? { ...r, verification_status: status } : r)) }));
  };

  const pondName = (id: string | null) => data.ponds.find((p) => p.id === id)?.pond_name ?? "Unknown pond";
  const farmName = (id: string) => data.farms.find((f) => f.id === id)?.farm_name ?? "Unknown farm";

  // Flags obviously suspicious values for moderators
  const suspicious = (table: Table, r: Row): string | null => {
    if (table === "water_quality_logs") {
      if (r.ph != null && (r.ph < 4 || r.ph > 11)) return "pH out of plausible range";
      if (r.dissolved_oxygen != null && (r.dissolved_oxygen < 0 || r.dissolved_oxygen > 20)) return "DO out of plausible range";
      if (r.temperature != null && (r.temperature < 5 || r.temperature > 45)) return "Temperature implausible";
    }
    if (table === "daily_farm_logs" && r.mortality_count != null && r.mortality_count > 5000) return "Very high mortality";
    return null;
  };

  const describe = (table: Table, r: Row) => {
    switch (table) {
      case "farms": return { title: `${r.farm_name} · ${r.passport_share_token ?? ""}`, sub: `${r.location} · ${r.number_of_ponds} ponds declared` };
      case "ponds": return { title: `${r.pond_name} (${farmName(r.farm_id)})`, sub: `${r.species ?? "species —"} · ${r.area_acres ?? "—"} acres · ${r.status}` };
      case "daily_farm_logs": return { title: `${pondName(r.pond_id)} · ${r.log_date}`, sub: `Feed ${r.feed_quantity ?? "—"} kg · Mortality ${r.mortality_count ?? "—"}${r.pond_observation ? ` · ${r.pond_observation}` : ""}` };
      case "water_quality_logs": return { title: `${pondName(r.pond_id)} · ${new Date(r.recorded_at).toLocaleString("en-IN")}`, sub: `pH ${r.ph ?? "—"} · DO ${r.dissolved_oxygen ?? "—"} · Temp ${r.temperature ?? "—"} · Sal ${r.salinity ?? "—"} · NH3 ${r.ammonia ?? "—"}` };
    }
  };

  const list = (table: Table) => {
    const rows = data[table].filter((r) => !onlyUnverified || r.verification_status === "unverified");
    if (loading) return <Loader2 className="mx-auto h-5 w-5 animate-spin" />;
    if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nothing to review.</p>;
    return (
      <div className="space-y-2">
        {rows.map((r) => {
          const d = describe(table, r);
          const warn = suspicious(table, r);
          return (
            <div key={r.id} className="flex flex-col gap-2 border-b py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.sub}</p>
                {warn && <Badge variant="destructive" className="mt-1">{warn}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(r.verification_status)}>{r.verification_status}</Badge>
                <Button size="sm" variant="outline" onClick={() => setStatus(table, r.id, "verified")}><CheckCircle2 className="mr-1 h-4 w-4" />Verify</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(table, r.id, "flagged")}><Flag className="mr-1 h-4 w-4" />Flag</Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const count = (t: Table) => data[t].filter((r) => r.verification_status === "unverified").length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Farms, Ponds & Pond Logs — Moderation</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Switch id="unv" checked={onlyUnverified} onCheckedChange={setOnlyUnverified} /><Label htmlFor="unv">Unverified only</Label></div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="farms">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="farms">Farms ({count("farms")})</TabsTrigger>
            <TabsTrigger value="ponds">Ponds ({count("ponds")})</TabsTrigger>
            <TabsTrigger value="daily_farm_logs">Daily logs ({count("daily_farm_logs")})</TabsTrigger>
            <TabsTrigger value="water_quality_logs">Water logs ({count("water_quality_logs")})</TabsTrigger>
          </TabsList>
          {(["farms", "ponds", "daily_farm_logs", "water_quality_logs"] as Table[]).map((t) => (
            <TabsContent key={t} value={t} className="mt-4">{list(t)}</TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminFarmRecords;
