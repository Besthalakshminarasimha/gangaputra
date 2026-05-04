import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Loader2,
  Play,
  Terminal,
  History,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

type TaskRow = {
  id: string;
  objective: string;
  status: string;
  result: string | null;
  citations: string[] | null;
  error: string | null;
  created_at: string;
};

type LogLine = { ts: string; text: string; kind: "info" | "ok" | "err" };

const SUGGESTIONS = [
  "Check current shrimp export prices in Andhra Pradesh",
  "Find latest government subsidies for aquaculture in India",
  "Top 5 shrimp feed brands available in Bhimavaram with prices",
  "Latest White Spot disease outbreak news in India this month",
];

export default function CometAgentDashboard() {
  const { toast } = useToast();
  const [objective, setObjective] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [currentResult, setCurrentResult] = useState<TaskRow | null>(null);
  const [history, setHistory] = useState<TaskRow[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const pushLog = (text: string, kind: LogLine["kind"] = "info") => {
    setLogs((prev) => [
      ...prev,
      { ts: new Date().toLocaleTimeString(), text, kind },
    ]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("comet_agent_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (!error && data) setHistory(data as TaskRow[]);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runAgent = async () => {
    const obj = objective.trim();
    if (obj.length < 3) {
      toast({ title: "Enter a browsing objective", variant: "destructive" });
      return;
    }

    setRunning(true);
    setCurrentResult(null);
    setLogs([]);
    pushLog("Initializing Comet Browser Agent...");
    await new Promise((r) => setTimeout(r, 250));
    pushLog(`Objective: "${obj}"`);
    pushLog("Authenticating session...");
    await new Promise((r) => setTimeout(r, 250));
    pushLog("Researching the web...", "info");

    try {
      const { data, error } = await supabase.functions.invoke(
        "comet-browser-agent",
        { body: { objective: obj } },
      );

      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Unknown error");

      pushLog("Summarizing results...", "info");
      await new Promise((r) => setTimeout(r, 200));
      pushLog(
        `Done. ${data.citations?.length ?? 0} sources found.`,
        "ok",
      );

      const row: TaskRow = {
        id: data.taskId,
        objective: obj,
        status: "completed",
        result: data.result,
        citations: data.citations || [],
        error: null,
        created_at: new Date().toISOString(),
      };
      setCurrentResult(row);
      loadHistory();
      toast({ title: "Research complete", description: "Results ready." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      pushLog(`Error: ${msg}`, "err");
      toast({
        title: "Agent failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const applyToPlatform = async () => {
    if (!currentResult?.result) return;
    // Save a notification with the summary so the user can find it later
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "comet_agent",
      title: "Comet research saved",
      message: currentResult.objective,
      data: { taskId: currentResult.id },
    });
    toast({
      title: "Applied to platform",
      description: "Research saved to your notifications.",
    });
  };

  const deleteTask = async (id: string) => {
    await supabase.from("comet_agent_tasks").delete().eq("id", id);
    loadHistory();
    if (currentResult?.id === id) setCurrentResult(null);
  };

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Globe className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              Comet Browser Agent
              <Badge
                variant="secondary"
                className="bg-orange-500/10 text-orange-600 dark:text-orange-400"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Real-time web research powered by Perplexity
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="run" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="run">
              <Play className="h-4 w-4 mr-1" /> Run Agent
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" /> History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Browsing Objective
              </label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Check current shrimp export prices in Andhra Pradesh"
                rows={3}
                disabled={running}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={running}
                    onClick={() => setObjective(s)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/70 disabled:opacity-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={runAgent}
              disabled={running || objective.trim().length < 3}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Browsing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" /> Launch Agent
                </>
              )}
            </Button>

            {/* Status Terminal */}
            {(logs.length > 0 || running) && (
              <div className="rounded-lg border bg-zinc-950 text-zinc-100 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 text-xs">
                  <Terminal className="h-3.5 w-3.5 text-green-400" />
                  <span className="font-mono">comet-agent ~ status</span>
                </div>
                <ScrollArea className="h-40 p-3 font-mono text-xs">
                  {logs.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-500">{l.ts}</span>
                      <span
                        className={
                          l.kind === "ok"
                            ? "text-green-400"
                            : l.kind === "err"
                            ? "text-red-400"
                            : "text-zinc-200"
                        }
                      >
                        {l.kind === "ok"
                          ? "✓ "
                          : l.kind === "err"
                          ? "✗ "
                          : "› "}
                        {l.text}
                      </span>
                    </div>
                  ))}
                  {running && (
                    <div className="flex gap-2 text-amber-400 animate-pulse">
                      <span className="text-zinc-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span>● working...</span>
                    </div>
                  )}
                  <div ref={logEndRef} />
                </ScrollArea>
              </div>
            )}

            {/* Result */}
            {currentResult?.result && (
              <ResultCard task={currentResult} onApply={applyToPlatform} />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No previous tasks yet.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {t.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      ) : t.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t.objective}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCurrentResult(t)}
                        className="h-7 px-2 text-xs"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(t.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ResultCard({
  task,
  onApply,
}: {
  task: TaskRow;
  onApply: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
          Agent Report
        </h4>
        <Button
          size="sm"
          onClick={onApply}
          className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs"
        >
          Apply to Platform
        </Button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
        {task.result}
      </div>
      {task.citations && task.citations.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Sources ({task.citations.length})
          </p>
          <div className="space-y-1">
            {task.citations.slice(0, 8).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline truncate"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
