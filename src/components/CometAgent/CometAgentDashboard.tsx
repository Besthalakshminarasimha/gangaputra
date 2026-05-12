import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAutopilot } from "./AutopilotProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Sparkles, ShieldCheck, AlertTriangle, LogIn, Play, Loader2 } from "lucide-react";
import AutopilotTemplates from "./AutopilotTemplates";
import AutopilotRunHistory from "./AutopilotRunHistory";

const SUGGESTIONS = [
  "Open the store and add the first product to my cart",
  "Go to Farm and open the Disease Predictor",
  "Show me today's shrimp rates and scroll to the chart",
  "Open the Smart Feed calculator",
  "Take me to my orders page",
  "Go to Jobs and open the first job posting",
];

const MAX_LEN = 500;

export default function CometAgentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const ap = useAutopilot();
  const [objective, setObjective] = useState("");

  const launch = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const obj = objective.trim();
    if (obj.length < 5) return;
    await ap.start(obj);
  };

  const busy = ap.state === "planning" || ap.state === "running" || ap.state === "awaiting" || ap.state === "confirm" || ap.state === "paused";

  return (
    <div className="space-y-4">
    <Card className="border-orange-500/30 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Globe className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              Comet Browser Autopilot
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Sparkles className="h-3 w-3 mr-1" />
                In-app
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
              Tell it what to do — it navigates, scrolls, clicks and fills forms for you.
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!user && !authLoading && (
          <div className="rounded-md border bg-amber-500/10 border-amber-500/30 p-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">Sign in to use the autopilot.</p>
              <p className="text-xs text-muted-foreground">It runs actions on your behalf inside the app.</p>
            </div>
            <Button size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4 mr-1" /> Sign in
            </Button>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            What should the autopilot do?
          </label>
          <Textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value.slice(0, MAX_LEN))}
            placeholder="e.g. Open the store, add the first product to cart, go to checkout"
            rows={3}
            disabled={busy}
            className="resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => setObjective(s)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/70 disabled:opacity-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {objective.length}/{MAX_LEN}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div>
            <div className="font-medium">{ap.mode === "auto" ? "Auto mode" : "Guided mode"}</div>
            <div className="text-xs text-muted-foreground">
              {ap.mode === "auto"
                ? "Runs through steps automatically. Destructive steps still ask first."
                : "Asks before each step so you stay in control."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={ap.mode === "guided" ? "text-xs font-semibold" : "text-xs text-muted-foreground"}>Guided</span>
            <Switch checked={ap.mode === "auto"} onCheckedChange={(c) => ap.setMode(c ? "auto" : "guided")} disabled={busy} />
            <span className={ap.mode === "auto" ? "text-xs font-semibold" : "text-xs text-muted-foreground"}>Auto</span>
          </div>
        </div>

        <Button
          onClick={launch}
          disabled={busy || objective.trim().length < 5}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Autopilot running…
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" /> Launch Autopilot
            </>
          )}
        </Button>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          The autopilot can navigate routes, scroll, click buttons, fill forms, and submit actions
          (orders, sell requests, messages). Destructive steps always require your approval, even in Auto mode.
        </p>
      </CardContent>
    </Card>
    <AutopilotTemplates />
    <AutopilotRunHistory />
    </div>
  );
}
