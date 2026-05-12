import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronDown, ChevronRight, RefreshCw, Trash2 } from "lucide-react";

type Run = {
  id: string;
  objective: string;
  status: string;
  mode: string;
  summary: string | null;
  error: string | null;
  logs: { ts: number; text: string; kind: string }[] | null;
  started_at: string;
  completed_at: string | null;
};

const statusColor = (s: string) => {
  if (s === "completed") return "bg-green-600";
  if (s === "running") return "bg-orange-500";
  if (s === "error") return "bg-red-500";
  if (s === "stopped") return "bg-muted-foreground";
  return "bg-secondary";
};

export default function AutopilotRunHistory() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("autopilot_runs")
      .select("id,objective,status,mode,summary,error,logs,started_at,completed_at")
      .order("started_at", { ascending: false })
      .limit(30);
    if (data) setRuns(data as unknown as Run[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const remove = async (id: string) => {
    await supabase.from("autopilot_runs").delete().eq("id", id);
    setRuns((p) => p.filter((r) => r.id !== id));
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-orange-500" /> Run history
          <Badge variant="outline" className="ml-auto text-xs">{runs.length}</Badge>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-xs text-muted-foreground">No autopilot runs yet.</div>
        ) : (
          <ScrollArea className="h-72 pr-2">
            <div className="space-y-2">
              {runs.map((r) => {
                const isOpen = open === r.id;
                const dur =
                  r.completed_at
                    ? Math.round((new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 100) / 10
                    : null;
                return (
                  <div key={r.id} className="rounded-md border text-xs">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      className="w-full text-left p-2 flex items-start gap-2 hover:bg-muted/40 transition-colors"
                    >
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 mt-0.5" /> : <ChevronRight className="h-3.5 w-3.5 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge className={`${statusColor(r.status)} text-[10px] py-0`}>{r.status}</Badge>
                          <Badge variant="outline" className="text-[10px] py-0">{r.mode}</Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(r.started_at).toLocaleString()}
                            {dur !== null && ` · ${dur}s`}
                          </span>
                        </div>
                        <div className="font-medium truncate mt-1">{r.objective}</div>
                        {r.summary && <div className="text-muted-foreground truncate">{r.summary}</div>}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(r.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </button>
                    {isOpen && (
                      <div className="border-t p-2 bg-muted/30 font-mono text-[11px] max-h-48 overflow-y-auto">
                        {r.error && <div className="text-red-600 mb-1">Error: {r.error}</div>}
                        {(r.logs || []).map((l, i) => (
                          <div
                            key={i}
                            className={
                              l.kind === "ok"
                                ? "text-green-600 dark:text-green-400"
                                : l.kind === "err"
                                ? "text-red-600 dark:text-red-400"
                                : l.kind === "warn"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }
                          >
                            {l.text}
                          </div>
                        ))}
                        {(!r.logs || r.logs.length === 0) && (
                          <div className="text-muted-foreground">No logs recorded.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
