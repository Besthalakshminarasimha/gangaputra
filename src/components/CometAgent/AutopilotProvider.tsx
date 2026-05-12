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

type RunState =
  | "idle"
  | "planning"
  | "running"
  | "paused"
  | "awaiting"
  | "confirm"
  | "done"
  | "error";

type LogEntry = { ts: number; text: string; kind: "info" | "ok" | "err" | "warn" };

type ConfirmPayload = {
  action: AutopilotAction;
  preview?: { label: string; value: string }[];
  warning?: string;
};

type AutopilotCtx = {
  mode: AutopilotMode;
  setMode: (m: AutopilotMode) => void;
  state: RunState;
  summary: string;
  actions: AutopilotAction[];
  currentIndex: number;
  panelOpen: boolean;
  log: LogEntry[];
  confirm: ConfirmPayload | null;
  start: (objective: string, presetPlan?: AutopilotAction[], presetSummary?: string) => Promise<void>;
  approveNext: () => void;
  skip: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  closePanel: () => void;
  saveAsTemplate: (name: string, description?: string) => Promise<void>;
  openPanel: () => void;
};

const Ctx = createContext<AutopilotCtx | null>(null);
export const useAutopilot = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutopilot must be inside AutopilotProvider");
  return v;
};

// --- selector resolution ----------------------------------------------------
type ResolveResult = { el: HTMLElement | null; reason: string; tried: string[] };

function visible(el: HTMLElement) {
  if (!el.offsetParent && el.tagName !== "BODY") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function resolveDetailed(selector?: string): ResolveResult {
  const tried: string[] = [];
  if (!selector) return { el: null, reason: "no selector provided", tried };
  const s = selector.trim();
  try {
    if (s.startsWith("text=")) {
      const t = s.slice(5).toLowerCase();
      tried.push(`text~="${t}"`);
      const candidates = document.querySelectorAll<HTMLElement>(
        "button, a, [role=button], [role=tab], [role=menuitem], summary, label"
      );
      // exact, then contains
      for (const el of Array.from(candidates)) {
        if (visible(el) && el.innerText?.trim().toLowerCase() === t) return { el, reason: "exact text match", tried };
      }
      for (const el of Array.from(candidates)) {
        if (visible(el) && el.innerText?.trim().toLowerCase().includes(t)) return { el, reason: "partial text match", tried };
      }
      // aria-label fallback
      tried.push(`aria-label~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[aria-label]"))) {
        if (visible(el) && (el.getAttribute("aria-label") || "").toLowerCase().includes(t)) {
          return { el, reason: "aria-label fallback", tried };
        }
      }
      // title fallback
      tried.push(`title~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[title]"))) {
        if (visible(el) && (el.getAttribute("title") || "").toLowerCase().includes(t)) {
          return { el, reason: "title fallback", tried };
        }
      }
      return { el: null, reason: `no visible button/link/role with text "${t}"`, tried };
    }
    if (s.startsWith("placeholder=")) {
      const t = s.slice(12).toLowerCase();
      tried.push(`placeholder~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("input, textarea"))) {
        const ph = (el as HTMLInputElement).placeholder?.toLowerCase() ?? "";
        if (visible(el) && ph.includes(t)) return { el, reason: "placeholder match", tried };
      }
      // label fallback
      tried.push(`label~="${t}"`);
      for (const lbl of Array.from(document.querySelectorAll<HTMLLabelElement>("label"))) {
        if (lbl.innerText?.toLowerCase().includes(t)) {
          const id = lbl.getAttribute("for");
          if (id) {
            const inp = document.getElementById(id) as HTMLElement | null;
            if (inp && visible(inp)) return { el: inp, reason: "label[for] fallback", tried };
          }
          const inp = lbl.querySelector<HTMLElement>("input,textarea,select");
          if (inp && visible(inp)) return { el: inp, reason: "label-wrapped input fallback", tried };
        }
      }
      // name fallback
      tried.push(`name~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("input[name], textarea[name]"))) {
        const n = (el as HTMLInputElement).name?.toLowerCase() ?? "";
        if (visible(el) && n.includes(t)) return { el, reason: "name attribute fallback", tried };
      }
      return { el: null, reason: `no input matching placeholder/label "${t}"`, tried };
    }
    if (s.startsWith("aria=")) {
      const t = s.slice(5).toLowerCase();
      tried.push(`aria-label~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[aria-label]"))) {
        if (visible(el) && (el.getAttribute("aria-label") || "").toLowerCase().includes(t)) {
          return { el, reason: "aria-label match", tried };
        }
      }
      tried.push(`role+text~="${t}"`);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[role]"))) {
        if (visible(el) && el.innerText?.toLowerCase().includes(t)) {
          return { el, reason: "role+text fallback", tried };
        }
      }
      return { el: null, reason: `no element with aria-label/role text "${t}"`, tried };
    }
    tried.push(`css="${s}"`);
    const el = document.querySelector<HTMLElement>(s);
    if (el && visible(el)) return { el, reason: "css selector match", tried };
    return { el: null, reason: `css selector "${s}" returned no visible element`, tried };
  } catch (e) {
    return { el: null, reason: `selector parse error: ${e instanceof Error ? e.message : "bad"}`, tried };
  }
}

function highlight(el: HTMLElement, ms = 1500) {
  const prevShadow = el.style.boxShadow;
  const prevOutline = el.style.outline;
  el.style.outline = "3px solid hsl(24 95% 53%)";
  el.style.boxShadow = "0 0 0 6px hsl(24 95% 53% / 0.25)";
  el.style.transition = "all 200ms ease";
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    el.style.boxShadow = prevShadow;
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

async function waitForElement(selector: string | undefined, timeoutMs: number): Promise<ResolveResult> {
  if (!selector) return { el: null, reason: "no selector", tried: [] };
  const start = Date.now();
  let last: ResolveResult = { el: null, reason: "not searched yet", tried: [] };
  while (Date.now() - start < timeoutMs) {
    last = resolveDetailed(selector);
    if (last.el) return last;
    await sleep(150);
  }
  return last;
}

// --- Fake-user / automation heuristics --------------------------------------
function detectFakeUser(): string | null {
  try {
    const nav = navigator as any;
    if (nav.webdriver) return "Automated browser detected (navigator.webdriver=true).";
    // headless UA hints
    const ua = navigator.userAgent || "";
    if (/HeadlessChrome|PhantomJS|Selenium|puppeteer|playwright/i.test(ua)) {
      return "Headless/automation browser signature detected in user agent.";
    }
    // Hardware concurrency 0 is suspicious
    if (nav.hardwareConcurrency === 0) return "Suspicious hardware fingerprint (0 cores).";
    // No languages = bot-like
    if (Array.isArray(navigator.languages) && navigator.languages.length === 0) {
      return "No browser languages — likely automation.";
    }
  } catch {/* ignore */}
  return null;
}

function isSuspiciousObjective(obj: string): string | null {
  const s = obj.toLowerCase();
  // Crude prompt-injection / abuse heuristics
  if (s.length > 800) return "Objective too long (likely automated/scripted).";
  if (/(?:bypass|disable).{0,20}(?:auth|login|security|2fa|captcha)/.test(s))
    return "Objective tries to bypass security controls.";
  if (/(?:scrape|exfiltrate|dump).{0,20}(?:database|users|emails|passwords)/.test(s))
    return "Objective looks like data exfiltration.";
  if (/sudo |rm -rf|drop table/.test(s)) return "Objective contains destructive commands.";
  return null;
}

// --- Provider ---------------------------------------------------------------
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
  const [log, setLog] = useState<LogEntry[]>([]);
  const [confirm, setConfirm] = useState<ConfirmPayload | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [lastObjective, setLastObjective] = useState("");

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const approveRef = useRef<(() => void) | null>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const logRef = useRef<LogEntry[]>([]);

  const append = useCallback((text: string, kind: LogEntry["kind"] = "info") => {
    const entry = { ts: Date.now(), text, kind };
    logRef.current = [...logRef.current, entry];
    setLog(logRef.current);
  }, []);

  const persistRun = useCallback(
    async (patch: Record<string, any>) => {
      if (!runId) return;
      try {
        await supabase.from("autopilot_runs").update(patch).eq("id", runId);
      } catch {/* ignore */}
    },
    [runId]
  );

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

  // Build a preview snapshot for destructive/submit actions: list visible filled fields
  const buildSubmitPreview = useCallback((selector?: string) => {
    const result: { label: string; value: string }[] = [];
    let form: HTMLFormElement | null = null;
    if (selector) {
      const r = resolveDetailed(selector);
      if (r.el) {
        form = r.el.closest("form") as HTMLFormElement | null;
        if (!form && r.el instanceof HTMLFormElement) form = r.el;
      }
    }
    if (!form) form = document.querySelector("form");
    if (!form) return result;
    const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );
    for (const f of Array.from(fields)) {
      if (f.type === "hidden" || f.type === "password") continue;
      const label =
        f.getAttribute("aria-label") ||
        f.getAttribute("placeholder") ||
        f.getAttribute("name") ||
        f.id ||
        f.type;
      let value = "value" in f ? (f as HTMLInputElement).value : "";
      if (f instanceof HTMLInputElement && (f.type === "checkbox" || f.type === "radio")) {
        value = f.checked ? "✓" : "—";
      }
      if (value && value.length > 80) value = value.slice(0, 80) + "…";
      if (label) result.push({ label, value: value || "—" });
    }
    return result.slice(0, 12);
  }, []);

  const askConfirm = useCallback(
    (payload: ConfirmPayload) =>
      new Promise<"go" | "skip">((resolve) => {
        setConfirm(payload);
        setState("confirm");
        approveRef.current = () => {
          setConfirm(null);
          resolve("go");
        };
        skipRef.current = () => {
          setConfirm(null);
          resolve("skip");
        };
      }),
    []
  );

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
            const r = resolveDetailed(a.selector);
            if (r.el) r.el.scrollIntoView({ behavior: "smooth", block: "center" });
            else append(`Scroll target not found — ${r.reason}`, "warn");
          } else if (a.position === "bottom") {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          await sleep(400);
          return;
        }
        case "click": {
          const r = await waitForElement(a.selector, 4000);
          if (!r.el) {
            throw new Error(
              `Could not find element for "${a.selector}". ${r.reason}. Tried: ${r.tried.join(", ")}`
            );
          }
          append(`Resolved click via ${r.reason}`, "info");
          highlight(r.el, 800);
          await sleep(450);
          r.el.click();
          return;
        }
        case "fill": {
          const r = await waitForElement(a.selector, 4000);
          const el = r.el as HTMLInputElement | HTMLTextAreaElement | null;
          if (!el) {
            throw new Error(
              `Could not find input for "${a.selector}". ${r.reason}. Tried: ${r.tried.join(", ")}`
            );
          }
          append(`Resolved input via ${r.reason}`, "info");
          highlight(el, 600);
          el.focus();
          setReactInputValue(el, a.value ?? "");
          return;
        }
        case "submit": {
          const r = await waitForElement(a.selector, 4000);
          if (!r.el) {
            throw new Error(
              `Submit target not found "${a.selector}". ${r.reason}. Tried: ${r.tried.join(", ")}`
            );
          }
          append(`Resolved submit target via ${r.reason}`, "info");
          highlight(r.el, 800);
          await sleep(300);
          if (r.el instanceof HTMLFormElement) r.el.requestSubmit();
          else r.el.click();
          return;
        }
        case "wait":
          await sleep(Math.min(Math.max(a.ms ?? 500, 50), 5000));
          return;
        case "speak":
          if (a.text) toast({ title: "Autopilot", description: a.text });
          return;
      }
    },
    [navigate, location.pathname, toast, append]
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

        const isDestructive = a.type === "submit" || !!a.destructive;
        // Per-step approval: guided = every actionable step; auto = only destructive
        const stepNeedsApproval =
          a.type !== "speak" && a.type !== "wait" &&
          (mode === "guided" || isDestructive);

        if (stepNeedsApproval) {
          if (isDestructive) {
            // Build & show submission preview
            const preview = buildSubmitPreview(a.selector);
            const decision = await askConfirm({
              action: a,
              preview,
              warning: "This step will submit data. Review the values below before approving.",
            });
            if (stopRef.current) break;
            if (decision === "skip") {
              append(`Step ${i + 1} skipped (destructive)`, "warn");
              continue;
            }
          } else {
            setState("awaiting");
            const r = await waitForApproval();
            if (stopRef.current) break;
            if (r === "skip") {
              append(`Step ${i + 1} skipped`, "info");
              setState("running");
              continue;
            }
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
          toast({ title: "Autopilot stopped", description: msg, variant: "destructive" });
          await persistRun({
            status: "error",
            error: msg,
            logs: logRef.current,
            completed_at: new Date().toISOString(),
          });
          return;
        }

        await sleep(mode === "auto" ? 250 : 100);
      }
      if (!stopRef.current) {
        setState("done");
        append("Plan complete", "ok");
        await persistRun({
          status: "completed",
          logs: logRef.current,
          completed_at: new Date().toISOString(),
        });
      } else {
        setState("idle");
        await persistRun({
          status: "stopped",
          logs: logRef.current,
          completed_at: new Date().toISOString(),
        });
      }
    },
    [mode, append, executeAction, waitForApproval, waitWhilePaused, toast, askConfirm, buildSubmitPreview, persistRun]
  );

  const start = useCallback(
    async (objective: string, presetPlan?: AutopilotAction[], presetSummary?: string) => {
      // Fake-user / safety pre-checks
      const fake = detectFakeUser();
      if (fake) {
        toast({ title: "Autopilot blocked", description: fake, variant: "destructive" });
        return;
      }
      const sus = isSuspiciousObjective(objective);
      if (sus) {
        toast({ title: "Objective rejected", description: sus, variant: "destructive" });
        return;
      }

      setPanelOpen(true);
      logRef.current = [];
      setLog([]);
      setActions([]);
      setSummary("");
      setCurrentIndex(0);
      setLastObjective(objective);
      setRunId(null);

      // Create run row
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      let createdRunId: string | null = null;
      if (uid) {
        const { data: insRun } = await supabase
          .from("autopilot_runs")
          .insert({ user_id: uid, objective, mode, status: "running" })
          .select("id")
          .single();
        createdRunId = insRun?.id ?? null;
        setRunId(createdRunId);
      }

      try {
        let plan = presetPlan;
        let planSummary = presetSummary || "";
        if (!plan) {
          setState("planning");
          append(`Planning: "${objective}"`);
          const { data, error } = await supabase.functions.invoke("comet-autopilot", {
            body: { objective, currentRoute: location.pathname },
          });
          if (error || !data || data.error) {
            throw new Error(error?.message || data?.error || "Planning failed");
          }
          plan = (data.actions || []) as AutopilotAction[];
          planSummary = data.summary || "";
        } else {
          append(`Loaded template plan (${plan.length} steps)`);
        }
        if (!plan.length) throw new Error("Empty plan");
        setSummary(planSummary);
        setActions(plan);
        append(`Plan ready: ${plan.length} steps`, "ok");
        if (createdRunId) {
          await supabase
            .from("autopilot_runs")
            .update({ summary: planSummary, plan: plan as any })
            .eq("id", createdRunId);
        }
        await run(plan);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        append(msg, "err");
        setState("error");
        toast({ title: "Autopilot failed", description: msg, variant: "destructive" });
        if (createdRunId) {
          await supabase
            .from("autopilot_runs")
            .update({
              status: "error",
              error: msg,
              logs: logRef.current,
              completed_at: new Date().toISOString(),
            })
            .eq("id", createdRunId);
        }
      }
    },
    [location.pathname, append, run, toast, mode]
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
  const openPanel = useCallback(() => setPanelOpen(true), []);

  const saveAsTemplate = useCallback(
    async (name: string, description?: string) => {
      if (!actions.length) {
        toast({ title: "Nothing to save", description: "Run a plan first.", variant: "destructive" });
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        toast({ title: "Sign in required", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("autopilot_templates").insert({
        user_id: uid,
        name,
        description: description || null,
        objective: lastObjective,
        plan: actions as any,
      });
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Template saved", description: name });
      }
    },
    [actions, lastObjective, toast]
  );

  const value = useMemo<AutopilotCtx>(
    () => ({
      mode, setMode, state, summary, actions, currentIndex, panelOpen, log, confirm,
      start, approveNext, skip, pause, resume, stop, closePanel, openPanel, saveAsTemplate,
    }),
    [mode, state, summary, actions, currentIndex, panelOpen, log, confirm, start, approveNext, skip, pause, resume, stop, closePanel, openPanel, saveAsTemplate]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AutopilotPanel />
    </Ctx.Provider>
  );
}

// --- Floating panel ---------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  Save,
  ShieldAlert,
} from "lucide-react";

function AutopilotPanel() {
  const ap = useAutopilot();
  const [tplName, setTplName] = useState("");
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
      case "confirm":
        return <Badge className="bg-red-500"><ShieldAlert className="h-3 w-3 mr-1" />Confirm submit</Badge>;
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
    <div className="fixed bottom-20 right-4 z-[60] w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-2xl overflow-hidden">
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
            disabled={ap.state === "running" || ap.state === "awaiting" || ap.state === "confirm"}
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
          <div className="text-sm font-medium break-words">
            {current.type}
            {current.path ? `  →  ${current.path}` : ""}
            {current.selector ? `  →  ${current.selector}` : ""}
            {current.value ? `  =  "${current.value}"` : ""}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{current.reason}</div>
          {current.destructive && (
            <Badge variant="destructive" className="mt-1 text-[10px]">Destructive</Badge>
          )}
        </div>
      )}

      {ap.confirm && (
        <div className="px-3 py-2 border-b bg-red-500/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Confirm before submitting
          </div>
          {ap.confirm.warning && (
            <div className="text-[11px] text-muted-foreground mb-2">{ap.confirm.warning}</div>
          )}
          <div className="rounded border bg-background max-h-40 overflow-y-auto">
            {ap.confirm.preview && ap.confirm.preview.length > 0 ? (
              <table className="w-full text-[11px]">
                <tbody>
                  {ap.confirm.preview.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-2 py-1 text-muted-foreground w-1/2 truncate">{p.label}</td>
                      <td className="px-2 py-1 font-mono truncate">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                No form fields detected near the target — the action will run as-is.
              </div>
            )}
          </div>
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
                : l.kind === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }
          >
            {l.text}
          </div>
        ))}
      </ScrollArea>

      {(ap.state === "done" || ap.state === "error") && ap.actions.length > 0 && (
        <div className="p-2 border-t flex gap-1.5 items-center bg-muted/30">
          <Input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Save plan as template…"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={tplName.trim().length < 2}
            onClick={async () => {
              await ap.saveAsTemplate(tplName.trim());
              setTplName("");
            }}
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      )}

      <div className="p-2 border-t flex flex-wrap gap-1.5">
        {(ap.state === "awaiting" || ap.state === "confirm") && (
          <>
            <Button
              size="sm"
              className={`flex-1 h-8 text-xs ${ap.state === "confirm" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}`}
              onClick={ap.approveNext}
            >
              <ChevronRight className="h-3.5 w-3.5 mr-1" />
              {ap.state === "confirm" ? "Confirm & submit" : "Approve"}
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
        {(ap.state === "running" || ap.state === "awaiting" || ap.state === "confirm" || ap.state === "paused") && (
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
