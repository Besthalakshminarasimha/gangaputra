import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAutopilot, AutopilotAction } from "./AutopilotProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { BookmarkPlus, Play, Trash2, Library } from "lucide-react";

type Template = {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  plan: AutopilotAction[];
  created_at: string;
};

export default function AutopilotTemplates() {
  const { user } = useAuth();
  const ap = useAutopilot();
  const { toast } = useToast();
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("autopilot_templates")
      .select("id,name,description,objective,plan,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setItems(data as unknown as Template[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("autopilot_templates").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else setItems((p) => p.filter((t) => t.id !== id));
  };

  const runTpl = async (t: Template) => {
    await ap.start(t.objective, t.plan, `Re-running template: ${t.name}`);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="h-4 w-4 text-orange-500" /> Saved templates
          <Badge variant="outline" className="ml-auto text-xs">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <BookmarkPlus className="h-3.5 w-3.5" />
            No templates yet. After a successful run, save it from the autopilot panel.
          </div>
        ) : (
          <ScrollArea className="h-56 pr-2">
            <div className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="rounded-md border p-2 text-xs flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-muted-foreground truncate">{t.objective}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {t.plan?.length ?? 0} steps · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-orange-500 hover:bg-orange-600" onClick={() => runTpl(t)}>
                    <Play className="h-3 w-3 mr-1" /> Run
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
