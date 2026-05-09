import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AutopilotAction = {
  type: "navigate" | "scroll" | "click" | "fill" | "submit" | "wait" | "speak";
  path?: string;
  selector?: string;
  value?: string;
  ms?: number;
  text?: string;
  position?: "top" | "bottom";
  reason: string;
  destructive?: boolean;
};

export type AutopilotMode = "auto" | "guided";

type RunState = "idle" | "planning" | "running" | "paused" | "awaiting" | "done" | "error";

type AutopilotCtx = {
  mode: AutopilotMode;
  setMode: (m: AutopilotMode) => void;
  state: RunState;
  summary: string;
  actions: AutopilotAction[];
  currentIndex: number;
  panelOpen: boolean;
  log: { ts: number; text: string; kind: "info" | "ok" | "err" }[];
  start: (objective: string) => Promise<void>;
  approveNext: () => void;
  skip: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  closePanel: () => void;
};

const Ctx = createContext<AutopilotCtx | null>(null);
export const useAutopilot = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutopilot must be inside AutopilotProvider");
  return v;
};

// --- selector resolution ----------------------------------------------------
function resolve(selector?: string): HTMLElement | null {
  if (!selector) return null;
  const s = selector.trim();
  try {
    if (s.startsWith("text=")) {
      const t = s.slice(5).toLowerCase();
      const candidates = document.querySelectorAll<HTMLElement>(
        "button, a, [role=button], [role=tab], [role=menuitem]"
      );
      for (const el of Array.from(candidates)) {
        if (el.offsetParent !== null && el.innerText?.trim().toLowerCase().includes(t)) return el;
      }
      return null;
    }
    if (s.startsWith("placeholder=")) {
      const t = s.slice(12).toLowerCase();
      const els = document.querySelectorAll<HTMLElement>("input, textarea");
      for (const el of Array.from(els)) {
        const ph = (el as HTMLInputElement).placeholder?.toLowerCase() ?? "";
        if (ph.includes(t)) return el;
      }
      return null;
    }
    if (s.startsWith("aria=")) {
      const t = s.slice(5).toLowerCase();
      const els = document.querySelectorAll<HTMLElement>("[aria-label]");
      for (const el of Array.from(els)) {
        if ((el.getAttribute("aria-label") || "").toLowerCase().includes(t)) return el;
      }
      return null;
    }
    return document.querySelector<HTMLElement>(s);
  } catch {
    return null;
  }
}

function highlight(el: HTMLElement, ms = 1500) {
  const prev = el.style.boxShadow;
  const prevOutline = el.style.outline;
  el.style.outline = "3px solid hsl(24 95% 53%)";
  el.style.boxShadow = "0 0 0 6px hsl(24 95% 53% / 0.25)";
  el.style.transition = "all 200ms ease";
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    el.style.boxShadow = prev;
    el.style.outline = prevOutline;
  }, ms);
}

function setReactInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AutopilotProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<AutopilotMode>("guided");
  const [state, setState] = useState<RunState>("idle");
  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState<AutopilotAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [log, setLog] = useState<AutopilotCtx["log"]>([]);

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const approveRef = useRef<(() => void) | null>(null);
  const skipRef = useRef<(() => void) | null>(null);

  const append = useCallback((text: string, kind: "info" | "ok" | "err" = "info") => {
    setLog((p) => [...p, { ts: Date.now(), text, kind }]);
  }, []);

  const waitForApproval = useCallback(
    () =>
      new Promise<"go" | "skip">((resolve) => {
        approveRef.current = () => resolve("go");
        skipRef.current = () => resolve("skip");
      }),
    []
  );

  const waitWhilePaused = useCallback(async () => {
    while (pauseRef.current && !stopRef.current) await sleep(150);
  }, []);

  const executeAction = useCallback(
    async (a: AutopilotAction) => {
      switch (a.type) {
        case "navigate": {
          if (!a.path) throw new Error("navigate missing path");
          if (location.pathname !== a.path) navigate(a.path);
          await sleep(450);
          return;
        }
        case "scroll": {
          if (a.selector) {
            const el = resolve(a.selector);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          } else if (a.position === "bottom") {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          await sleep(400);
          return;
        }
        case "click": {
          const el = await waitForElement(a.selector, 4000);
          if (!el) throw new Error(`Element not found: ${a.selector}`);
          highlight(el, 800);
          await sleep(450);
          el.click();
          return;
        }
        case "fill": {
          const el = (await waitForElement(a.selector, 4000)) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
          if (!el) throw new Error(`Input not found: ${a.selector}`);
          highlight(el, 600);
          el.focus();
          setReactInputValue(el, a.value ?? "");
          return;
        }
        case "submit": {
          const el = await waitForElement(a.selector, 4000);
          if (!el) throw new Error(`Submit target not found: ${a.selector}`);
          highlight(el, 800);
          await sleep(300);
          if (el instanceof HTMLFormElement) el.requestSubmit();
          else el.click();
          return;
        }
        case "wait":
          await sleep(Math.min(Math.max(a.ms ?? 500, 50), 5000));
          return;
        case "speak":
          if (a.text) {
            toast({ title: "Autopilot", description: a.text });
          }
          return;
      }
    },
    [navigate, location.pathname, toast]
  );

  const run = useCallback(
    async (plan: AutopilotAction[]) => {
      stopRef.current = false;
      pauseRef.current = false;
      setState("running");
      for (let i = 0; i < plan.length; i++) {
        if (stopRef.current) break;
        await waitWhilePaused();
        setCurrentIndex(i);
        const a = plan[i];
        append(`Step ${i + 1}/${plan.length}: ${a.type} — ${a.reason}`);

        // Guided mode: ask for approval before each non-trivial action.
        // Auto mode: still ask for destructive actions (submit, or destructive flag).
        const needsApproval =
          mode === "guided" || a.type === "submit" || !!a.destructive;
        if (needsApproval && a.type !== "speak" && a.type !== "wait") {
          setState("awaiting");
          const r = await waitForApproval();
          if (stopRef.current) break;
          if (r === "skip") {
            append(`Step ${i + 1} skipped`, "info");
            setState("running");
            continue;
          }
          setState("running");
        }

        try {
          await executeAction(a);
          append(`✓ ${a.type} done`, "ok");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "step failed";
          append(`✗ ${msg}`, "err");
          setState("error");
          toast({
            title: "Autopilot stopped",
            description: msg,
            variant: "destructive",
          });
          return;
        }

        // small breathing room between steps
        await sleep(mode === "auto" ? 250 : 100);
      }
      if (!stopRef.current) {
        setState("done");
        append("Plan complete", "ok");
      } else {
        setState("idle");
      }
    },
    [mode, append, executeAction, waitForApproval, waitWhilePaused, toast]
  );

  const start = useCallback(
    async (objective: string) => {
      setPanelOpen(true);
      setLog([]);
      setActions([]);
      setSummary("");
      setCurrentIndex(0);
      setState("planning");
      append(`Planning: "${objective}"`);
      try {
        const { data, error } = await supabase.functions.invoke("comet-autopilot", {
          body: { objective, currentRoute: location.pathname },
        });
        if (error || !data || data.error) {
          throw new Error(error?.message || data?.error || "Planning failed");
        }
        const plan = (data.actions || []) as AutopilotAction[];
        if (plan.length === 0) throw new Error("Empty plan from agent");
        setSummary(data.summary || "");
        setActions(plan);
        append(`Plan ready: ${plan.length} steps`, "ok");
        await run(plan);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        append(msg, "err");
        setState("error");
        toast({ title: "Autopilot failed", description: msg, variant: "destructive" });
      }
    },
    [location.pathname, append, run, toast]
  );

  const approveNext = useCallback(() => approveRef.current?.(), []);
  const skip = useCallback(() => skipRef.current?.(), []);
  const pause = useCallback(() => {
    pauseRef.current = true;
    setState("paused");
    append("Paused");
  }, [append]);
  const resume = useCallback(() => {
    pauseRef.current = false;
    setState("running");
    append("Resumed");
  }, [append]);
  const stop = useCallback(() => {
    stopRef.current = true;
    pauseRef.current = false;
    approveRef.current?.();
    setState("idle");
    append("Stopped by user");
  }, [append]);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      state,
      summary,
      actions,
      currentIndex,
      panelOpen,
      log,
      start,
      approveNext,
      skip,
      pause,
      resume,
      stop,
      closePanel,
    }),
    [mode, state, summary, actions, currentIndex, panelOpen, log, start, approveNext, skip, pause, resume, stop, closePanel]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AutopilotPanel />
    </Ctx.Provider>
  );
}

// Wait for an element to appear (handles route transitions / dialogs)
async function waitForElement(selector: string | undefined, timeoutMs: number): Promise<HTMLElement | null> {
  if (!selector) return null;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = resolve(selector);
    if (el) return el;
    await sleep(150);
  }
  return null;
}

// --- Floating panel ---------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Pause,
  Play,
  Square,
  ChevronRight,
  SkipForward,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function AutopilotPanel() {
  const ap = useAutopilot();
  if (!ap.panelOpen) return null;

  const current = ap.actions[ap.currentIndex];
  const statusBadge = () => {
    switch (ap.state) {
      case "planning":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Planning</Badge>;
      case "running":
        return <Badge className="bg-orange-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case "awaiting":
        return <Badge className="bg-amber-500">Awaiting approval</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "done":
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Done</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-gradient-to-r from-orange-500/10 to-amber-500/10">
        <Bot className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold flex-1">Comet Autopilot</span>
        {statusBadge()}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={ap.closePanel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="px-3 py-2 border-b flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Mode</span>
        <div className="flex items-center gap-2">
          <span className={ap.mode === "guided" ? "font-semibold" : "text-muted-foreground"}>Guided</span>
          <Switch
            checked={ap.mode === "auto"}
            onCheckedChange={(c) => ap.setMode(c ? "auto" : "guided")}
            disabled={ap.state === "running" || ap.state === "awaiting"}
          />
          <span className={ap.mode === "auto" ? "font-semibold" : "text-muted-foreground"}>Auto</span>
        </div>
      </div>

      {ap.summary && (
        <div className="px-3 py-2 border-b text-xs text-muted-foreground">{ap.summary}</div>
      )}

      {current && (
        <div className="px-3 py-2 border-b bg-muted/40">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Step {ap.currentIndex + 1} / {ap.actions.length}
          </div>
          <div className="text-sm font-medium">
            {current.type}
            {current.path ? `  →  ${current.path}` : ""}
            {current.selector ? `  →  ${current.selector}` : ""}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{current.reason}</div>
          {current.destructive && (
            <Badge variant="destructive" className="mt-1 text-[10px]">Destructive</Badge>
          )}
        </div>
      )}

      <ScrollArea className="h-32 px-3 py-2 text-xs font-mono">
        {ap.log.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "ok"
                ? "text-green-600 dark:text-green-400"
                : l.kind === "err"
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            }
          >
            {l.text}
          </div>
        ))}
      </ScrollArea>

      <div className="p-2 border-t flex flex-wrap gap-1.5">
        {ap.state === "awaiting" && (
          <>
            <Button size="sm" className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600" onClick={ap.approveNext}>
              <ChevronRight className="h-3.5 w-3.5 mr-1" />Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={ap.skip}>
              <SkipForward className="h-3.5 w-3.5 mr-1" />Skip
            </Button>
          </>
        )}
        {ap.state === "running" && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={ap.pause}>
            <Pause className="h-3.5 w-3.5 mr-1" />Pause
          </Button>
        )}
        {ap.state === "paused" && (
          <Button size="sm" className="h-8 text-xs" onClick={ap.resume}>
            <Play className="h-3.5 w-3.5 mr-1" />Resume
          </Button>
        )}
        {(ap.state === "running" || ap.state === "awaiting" || ap.state === "paused") && (
          <Button size="sm" variant="destructive" className="h-8 text-xs ml-auto" onClick={ap.stop}>
            <Square className="h-3.5 w-3.5 mr-1" />Stop
          </Button>
        )}
        {(ap.state === "done" || ap.state === "error" || ap.state === "idle") && (
          <Button size="sm" variant="outline" className="h-8 text-xs ml-auto" onClick={ap.closePanel}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
