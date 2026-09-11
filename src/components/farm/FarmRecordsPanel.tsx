import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Fish, Plus, Save, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Farm = { id: string; farm_name: string };
type Pond = { id: string; farm_id: string; pond_name: string; species: string | null; status: string };
type DailyLog = {
  id: string;
  pond_id: string | null;
  log_date: string;
  feed_quantity: number | null;
  mortality_count: number | null;
  pond_observation: string | null;
};

const FarmRecordsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedPondId, setSelectedPondId] = useState("");
  const [pondName, setPondName] = useState("");
  const [species, setSpecies] = useState("");
  const [feedQuantity, setFeedQuantity] = useState("");
  const [mortalityCount, setMortalityCount] = useState("");
  const [observation, setObservation] = useState("");
  const [savingPond, setSavingPond] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  const selectedPond = useMemo(
    () => ponds.find((pond) => pond.id === selectedPondId),
    [ponds, selectedPondId]
  );

  const loadRecords = async () => {
    if (!user) return;

    const [farmsResult, pondsResult, logsResult] = await Promise.all([
      supabase.from("farms").select("id, farm_name").eq("user_id", user.id).order("created_at"),
      supabase.from("ponds").select("id, farm_id, pond_name, species, status").eq("user_id", user.id).order("created_at"),
      supabase
        .from("daily_farm_logs")
        .select("id, pond_id, log_date, feed_quantity, mortality_count, pond_observation")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(6),
    ]);

    if (farmsResult.error || pondsResult.error || logsResult.error) {
      console.error("Unable to load farm records", farmsResult.error || pondsResult.error || logsResult.error);
      return;
    }

    const nextFarms = (farmsResult.data ?? []) as Farm[];
    const nextPonds = (pondsResult.data ?? []) as Pond[];
    setFarms(nextFarms);
    setPonds(nextPonds);
    setDailyLogs((logsResult.data ?? []) as DailyLog[]);
    setSelectedFarmId((current) => current || nextFarms[0]?.id || "");
    setSelectedPondId((current) => current || nextPonds[0]?.id || "");
  };

  useEffect(() => {
    void loadRecords();
  }, [user]);

  const handleAddPond = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedFarmId || !pondName.trim()) return;

    setSavingPond(true);
    const { error } = await supabase.from("ponds").insert({
      farm_id: selectedFarmId,
      user_id: user.id,
      pond_name: pondName.trim(),
      species: species.trim() || null,
    });
    setSavingPond(false);

    if (error) {
      toast({ title: "Pond could not be saved", description: error.message, variant: "destructive" });
      return;
    }

    setPondName("");
    setSpecies("");
    toast({ title: "Pond added", description: "Your pond is now part of your farm records." });
    await loadRecords();
  };

  const handleAddDailyLog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedPondId) return;

    setSavingLog(true);
    const { error } = await supabase.from("daily_farm_logs").insert({
      pond_id: selectedPondId,
      user_id: user.id,
      feed_quantity: feedQuantity ? Number(feedQuantity) : null,
      mortality_count: mortalityCount ? Number(mortalityCount) : null,
      pond_observation: observation.trim() || null,
    });
    setSavingLog(false);

    if (error) {
      toast({ title: "Daily log could not be saved", description: error.message, variant: "destructive" });
      return;
    }

    setFeedQuantity("");
    setMortalityCount("");
    setObservation("");
    toast({ title: "Daily log saved", description: "Today’s farm activity has been recorded." });
    await loadRecords();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            My Farm Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {farms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a farm from the dashboard before creating pond records.</p>
          ) : (
            <form onSubmit={handleAddPond} className="grid gap-3 md:grid-cols-4 md:items-end">
              <div className="space-y-2">
                <Label htmlFor="record-farm">Farm</Label>
                <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                  <SelectTrigger id="record-farm"><SelectValue placeholder="Choose a farm" /></SelectTrigger>
                  <SelectContent>{farms.map((farm) => <SelectItem key={farm.id} value={farm.id}>{farm.farm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pond-name">Pond name</Label>
                <Input id="pond-name" value={pondName} onChange={(event) => setPondName(event.target.value)} placeholder="Pond 1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pond-species">Species</Label>
                <Input id="pond-species" value={species} onChange={(event) => setSpecies(event.target.value)} placeholder="Optional" />
              </div>
              <Button type="submit" disabled={savingPond}><Plus className="mr-2 h-4 w-4" />{savingPond ? "Saving..." : "Add pond"}</Button>
            </form>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ponds.map((pond) => (
              <button key={pond.id} type="button" onClick={() => setSelectedPondId(pond.id)} className="rounded-lg border p-3 text-left transition-colors hover:bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{pond.pond_name}</span>
                  <Badge variant={pond.status === "active" ? "secondary" : "outline"}>{pond.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pond.species || "Species not recorded"}</p>
              </button>
            ))}
          </div>
          {ponds.length === 0 && <p className="text-sm text-muted-foreground">No ponds recorded yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Daily farm log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ponds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a pond to start recording feed, mortality, and observations.</p>
          ) : (
            <form onSubmit={handleAddDailyLog} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-pond">Pond</Label>
                <Select value={selectedPondId} onValueChange={setSelectedPondId}>
                  <SelectTrigger id="log-pond"><SelectValue placeholder="Choose a pond" /></SelectTrigger>
                  <SelectContent>{ponds.map((pond) => <SelectItem key={pond.id} value={pond.id}>{pond.pond_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="feed-quantity">Feed quantity (kg)</Label><Input id="feed-quantity" type="number" min="0" step="0.1" value={feedQuantity} onChange={(event) => setFeedQuantity(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="mortality-count">Mortality count</Label><Input id="mortality-count" type="number" min="0" step="1" value={mortalityCount} onChange={(event) => setMortalityCount(event.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="pond-observation">Observation</Label><Textarea id="pond-observation" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Record what you observed today" /></div>
              <Button type="submit" disabled={savingLog || !selectedPondId}><Save className="mr-2 h-4 w-4" />{savingLog ? "Saving..." : `Save ${selectedPond?.pond_name || "pond"} log`}</Button>
            </form>
          )}

          <div className="space-y-2">
            {dailyLogs.map((log) => {
              const pond = ponds.find((item) => item.id === log.pond_id);
              return <div key={log.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium">{pond?.pond_name || "Farm log"}</span><span className="text-xs text-muted-foreground">{new Date(log.log_date).toLocaleDateString("en-IN")}</span></div><p className="mt-1 text-sm text-muted-foreground">Feed: {log.feed_quantity ?? "Not recorded"} kg · Mortality: {log.mortality_count ?? "Not recorded"}</p>{log.pond_observation && <p className="mt-1 text-sm">{log.pond_observation}</p>}</div>;
            })}
            {dailyLogs.length === 0 && <p className="text-sm text-muted-foreground">No daily logs recorded yet.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <Waves className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        Water readings and device data appear only after you record them or connect a supported integration.
      </div>
    </div>
  );
};

export default FarmRecordsPanel;