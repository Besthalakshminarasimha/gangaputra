import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fish, ShieldCheck, Loader2 } from "lucide-react";

// Beta namespace — typed wrapper so TS doesn't complain
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as any).oauth as OAuthApi;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      if (!oauth?.getAuthorizationDetails) {
        setError("OAuth SDK not available. Please update the app.");
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message || String(error));
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message || String(error));
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/40">
          <CardHeader>
            <CardTitle>Could not load this authorization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );

  if (!details)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const clientName = details.client?.name ?? details.client?.client_name ?? "an app";
  const redirect = details.client?.redirect_uris?.[0] ?? details.redirect_uri ?? "—";
  const scopes: string[] = details.scopes ?? details.requested_scopes ?? [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Fish className="h-6 w-6 text-primary" />
            <span className="font-bold">GANGAPUTRA</span>
          </div>
          <CardTitle className="text-lg">Connect {clientName} to your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This lets <b>{clientName}</b> use GANGAPUTRA tools while you are signed in.
            Your app permissions and backend policies still decide what data is accessible.
          </p>

          <div className="rounded-md border p-3 text-xs space-y-1 bg-muted/30">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Redirect</span>
              <span className="font-mono truncate max-w-[220px]" title={redirect}>{redirect}</span>
            </div>
            {scopes.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Scopes</span>
                <span>{scopes.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="rounded-md border p-3 text-xs bg-primary/5 border-primary/20 flex gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>The app will act as you. It can read your farms, orders, and health reports and schedule tasks for you — nothing more.</div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
