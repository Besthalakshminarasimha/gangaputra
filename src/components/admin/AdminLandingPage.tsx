import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RotateCcw, Save } from "lucide-react";
import {
  DEFAULT_LANDING_CONTENT,
  LANDING_CONTENT_KEY,
  fetchLandingContent,
  type LandingContent,
} from "@/lib/siteContent";

const AdminLandingPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLandingContent()
      .then(setForm)
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof LandingContent>(key: K, value: LandingContent[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("site_content")
      .upsert(
        [{
          key: LANDING_CONTENT_KEY,
          value: form as unknown as Record<string, unknown>,
          updated_by: user?.id,
        }],
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome page updated", description: "Changes are live on the home page." });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading welcome page content...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Welcome Page Content</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setForm(DEFAULT_LANDING_CONTENT)}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset to defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Headline</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Top badge text</Label><Input value={form.badge} onChange={(e) => set("badge", e.target.value)} /></div>
          <div><Label>Brand title</Label><Input value={form.brandTitle} onChange={(e) => set("brandTitle", e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Headline line 1</Label><Input value={form.titleLine1} onChange={(e) => set("titleLine1", e.target.value)} /></div>
            <div><Label>Headline line 2</Label><Input value={form.titleLine2} onChange={(e) => set("titleLine2", e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Primary button label</Label><Input value={form.primaryCta} onChange={(e) => set("primaryCta", e.target.value)} /></div>
            <div><Label>Secondary button label</Label><Input value={form.secondaryCta} onChange={(e) => set("secondaryCta", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Trust Stats</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.stats.map((stat, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3 rounded-md border p-3">
              <div><Label>Label</Label><Input value={stat.label} onChange={(e) => set("stats", form.stats.map((s, j) => j === i ? { ...s, label: e.target.value } : s))} /></div>
              <div><Label>Number</Label><Input type="number" value={stat.value} onChange={(e) => set("stats", form.stats.map((s, j) => j === i ? { ...s, value: Number(e.target.value) || 0 } : s))} /></div>
              <div><Label>Suffix</Label><Input value={stat.suffix} onChange={(e) => set("stats", form.stats.map((s, j) => j === i ? { ...s, suffix: e.target.value } : s))} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Feature Highlights</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.features.map((feature, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3 rounded-md border p-3">
              <div><Label>Label</Label><Input value={feature.label} onChange={(e) => set("features", form.features.map((f, j) => j === i ? { ...f, label: e.target.value } : f))} /></div>
              <div><Label>Value</Label><Input value={feature.value} onChange={(e) => set("features", form.features.map((f, j) => j === i ? { ...f, value: e.target.value } : f))} /></div>
              <div><Label>Description</Label><Input value={feature.description} onChange={(e) => set("features", form.features.map((f, j) => j === i ? { ...f, description: e.target.value } : f))} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLandingPage;
