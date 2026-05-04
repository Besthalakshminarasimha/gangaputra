import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  LogIn,
  ShieldCheck,
  AlertTriangle,
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

// Domain blocklist for URL inputs
const BLOCKED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // AWS metadata
  "metadata.google.internal",
];

const MAX_OBJECTIVE_LEN = 1000;
const MIN_OBJECTIVE_LEN = 5;

function validateObjective(input: string): { ok: true; value: string } | { ok: false; reason: string } {
  const trimmed = input.trim();
  if (trimmed.length < MIN_OBJECTIVE_LEN) {
    return { ok: false, reason: `Objective must be at least ${MIN_OBJECTIVE_LEN} characters.` };
  }
  if (trimmed.length > MAX_OBJECTIVE_LEN) {
    return { ok: false, reason: `Objective must be under ${MAX_OBJECTIVE_LEN} characters.` };
  }
  // If user provided URLs, validate them
  const urlMatches = trimmed.match(/https?:\/\/[^\s]+/gi) ?? [];
  for (const raw of urlMatches) {
    try {
      const u = new URL(raw);
      if (!["http:", "https:"].includes(u.protocol)) {
        return { ok: false, reason: `Disallowed URL protocol: ${u.protocol}` };
      }
      const host = u.hostname.toLowerCase();
      if (BLOCKED_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
        return { ok: false, reason: `Disallowed domain: ${host}` };
      }
      // Block private IP ranges
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
        return { ok: false, reason: `Private network address blocked: ${host}` };
      }
    } catch {
      return { ok: false, reason: `Invalid URL: ${raw}` };
    }
  }
  return { ok: true, value: trimmed };
}

export default function CometAgentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [objective, setObjective] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [currentResult, setCurrentResult] = useState<TaskRow | null>(null);
  const [history, setHistory] = useState<TaskRow[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const pushLog = (text: string, kind: LogLine["kind"] = "info") => {
    setLogs((prev) => [...prev, { ts: new Date().toLocaleTimeString(), text, kind }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const loadHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("comet_agent_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (!error && data) setHistory(data as TaskRow[]);
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const redirectToSignIn = () => {
    toast({
      title: "Sign in required",
      description: "Please sign in to use the Comet Browser Agent.",
      variant: "destructive",
    });
    navigate("/auth");
  };

  const runAgent = async () => {
    // Validate auth FIRST
    if (!user || !session?.access_token) {
      redirectToSignIn();
      return;
    }

    // Validate input
    const validation = validateObjective(objective);
    if (validation.ok === false) {
      toast({ title: "Invalid input", description: validation.reason, variant: "destructive" });
      return;
    }
    const obj = validation.value;

    setRunning(true);
    setCurrentResult(null);
    setLogs([]);
    pushLog("Initializing Comet Browser Agent...");
    pushLog(`Auth verified for ${user.email ?? user.id.slice(0, 8)}`, "ok");
    await new Promise((r) => setTimeout(r, 200));
    pushLog(`Objective: "${obj}"`);
    pushLog("Sending request with Bearer token...");
    await new Promise((r) => setTimeout(r, 200));
    pushLog("Researching the web...");

    try {
      // Explicitly forward the current access token as Bearer header
      const { data, error } = await supabase.functions.invoke("comet-browser-agent", {
        body: { objective: obj },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        // supabase-js wraps non-2xx into FunctionsHttpError with status on .context
        const status =
          (error as any)?.context?.status ??
          (error as any)?.status ??
          (typeof (error as any)?.message === "string" && /401/.test((error as any).message) ? 401 : undefined);

        if (status === 401) {
          pushLog("Server returned 401 Unauthorized.", "err");
          redirectToSignIn();
          return;
        }
        throw error;
      }

      if (!data || data.error) throw new Error(data?.error || "Unknown error from agent");

      pushLog("Summarizing results...");
      await new Promise((r) => setTimeout(r, 150));
      pushLog(`Done. ${data.citations?.length ?? 0} sources found.`, "ok");

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
      toast({ title: "Research complete", description: "Results are ready below." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      pushLog(`Error: ${msg}`, "err");
      toast({ title: "Agent failed", description: msg, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const applyToPlatform = async () => {
    if (!currentResult?.result || !user) return;
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "comet_agent",
      title: "Comet research saved",
      message: currentResult.objective,
      data: { taskId: currentResult.id },
    });
    toast({ title: "Applied to platform", description: "Saved to your notifications." });
  };

  const deleteTask = async (id: string) => {
    await supabase.from("comet_agent_tasks").delete().eq("id", id);
    loadHistory();
    if (currentResult?.id === id) setCurrentResult(null);
  };

  // Debug panel data
  const tokenPreview = session?.access_token
    ? `${session.access_token.slice(0, 14)}…${session.access_token.slice(-8)}`
    : null;

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Globe className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              Comet Browser Agent
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Sparkles className="h-3 w-3 mr-1" />
                Live
              </Badge>
              {user ? (
                <Badge variant="outline" className="text-green-600 border-green-600/30">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Authed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Signed out
                </Badge>
              )}
            </div>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Real-time web research powered by Perplexity
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setDebugOpen((v) => !v)}
          >
            {debugOpen ? "Hide" : "Debug"}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Auth Debug Panel */}
        {debugOpen && (
          <div className="mb-3 rounded-md border border-dashed border-orange-500/40 bg-muted/40 p-3 text-xs font-mono space-y-1">
            <div>auth.loading: <span className="text-foreground">{String(authLoading)}</span></div>
            <div>user.id: <span className="text-foreground">{user?.id ?? "—"}</span></div>
            <div>user.email: <span className="text-foreground">{user?.email ?? "—"}</span></div>
            <div>access_token present: <span className="text-foreground">{session?.access_token ? "✓ yes" : "✗ no"}</span></div>
            {tokenPreview && <div>token: <span className="text-foreground">{tokenPreview}</span></div>}
            <div>Authorization header: <span className="text-foreground">{session?.access_token ? `Bearer ${tokenPreview}` : "(none — request will fail)"}</span></div>
          </div>
        )}

        {!user && !authLoading && (
          <div className="mb-3 rounded-md border bg-amber-500/10 border-amber-500/30 p-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">Sign in to run the Comet agent.</p>
              <p className="text-xs text-muted-foreground">Your browsing tasks are saved to your account history.</p>
            </div>
            <Button size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4 mr-1" /> Sign in
            </Button>
          </div>
        )}

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
                onChange={(e) => setObjective(e.target.value.slice(0, MAX_OBJECTIVE_LEN))}
                placeholder="e.g. Check current shrimp export prices in Andhra Pradesh"
                rows={3}
                disabled={running}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-wrap gap-1.5">
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
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {objective.length}/{MAX_OBJECTIVE_LEN}
                </span>
              </div>
            </div>

            <Button
              onClick={runAgent}
              disabled={running || objective.trim().length < MIN_OBJECTIVE_LEN}
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
                        {l.kind === "ok" ? "✓ " : l.kind === "err" ? "✗ " : "› "}
                        {l.text}
                      </span>
                    </div>
                  ))}
                  {running && (
                    <div className="flex gap-2 text-amber-400 animate-pulse">
                      <span className="text-zinc-500">{new Date().toLocaleTimeString()}</span>
                      <span>● working...</span>
                    </div>
                  )}
                  <div ref={logEndRef} />
                </ScrollArea>
              </div>
            )}

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
                        <p className="text-sm font-medium truncate">{t.objective}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()}
                        </p>
                        {t.result && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {t.result.slice(0, 180)}
                          </p>
                        )}
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

function ResultCard({ task, onApply }: { task: TaskRow; onApply: () => void }) {
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
