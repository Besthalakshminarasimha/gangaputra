import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Mail, ListChecks, Search, Wand2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MultiToolAgent = () => {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);

  // Scrape
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("Summarize key insights for a shrimp farmer.");

  // Search
  const [query, setQuery] = useState("");

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Schedule
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Tasks list
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const call = async (tool: string, params: any) => {
    setLoading(true);
    setOutput(null);
    try {
      const { data, error } = await supabase.functions.invoke("multi-tool-agent", { body: { tool, params } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed");
      setOutput(data);
      return data;
    } catch (e: any) {
      toast.error(e.message || "Tool failed");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const d = await call("list_tasks", {});
    if (d?.tasks) {
      setTasks(d.tasks);
      setStats({ total: d.total, pending: d.pending, completed: d.completed });
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("agent_scheduled_tasks").update({ completed: !completed }).eq("id", id);
    loadTasks();
  };

  useEffect(() => { loadTasks(); /* eslint-disable-next-line */ }, []);

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-600" />
          Multi-Tool Agent
          <Badge variant="secondary" className="ml-auto">Scrape · Search · Email · Schedule</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scrape">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="scrape"><Globe className="h-3 w-3 mr-1" />Scrape</TabsTrigger>
            <TabsTrigger value="search"><Search className="h-3 w-3 mr-1" />Search</TabsTrigger>
            <TabsTrigger value="email"><Mail className="h-3 w-3 mr-1" />Email</TabsTrigger>
            <TabsTrigger value="tasks"><ListChecks className="h-3 w-3 mr-1" />Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="scrape" className="space-y-2 mt-3">
            <Input placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} />
            <Textarea placeholder="What should the AI summarize?" value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} />
            <Button disabled={loading || !url} onClick={() => call("scrape", { url, summarize: true, instruction })} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />} Scrape & Summarize
            </Button>
          </TabsContent>

          <TabsContent value="search" className="space-y-2 mt-3">
            <Input placeholder="Search the web (e.g. WSSV outbreak Andhra 2025)" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button disabled={loading || !query} onClick={() => call("search", { query, limit: 5 })} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />} Web Search
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-2 mt-3">
            <Input placeholder="recipient@example.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            <Input placeholder="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            <Textarea placeholder="Message body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
            <Button disabled={loading || !emailTo || !emailSubject} onClick={async () => {
              const r = await call("send_email", { to: emailTo, subject: emailSubject, html: emailBody.replace(/\n/g, "<br/>") });
              if (r?.success) toast.success("Email sent");
            }} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />} Send Email
            </Button>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border rounded p-2"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total</div></div>
              <div className="border rounded p-2"><div className="text-2xl font-bold text-amber-600">{stats.pending}</div><div className="text-xs text-muted-foreground">Pending</div></div>
              <div className="border rounded p-2"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-xs text-muted-foreground">Done</div></div>
            </div>
            <div className="space-y-2 border-t pt-2">
              <Input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <Textarea placeholder="Description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
              <Input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              <Button disabled={loading || !taskTitle} onClick={async () => {
                const r = await call("schedule_task", { title: taskTitle, description: taskDesc, due_date: taskDue || null });
                if (r?.success) { toast.success("Task scheduled"); setTaskTitle(""); setTaskDesc(""); setTaskDue(""); loadTasks(); }
              }} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ListChecks className="h-4 w-4 mr-1" />} Add to Calendar
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 border rounded p-2 text-sm">
                  <button onClick={() => toggleTask(t.id, t.completed)}>
                    <CheckCircle2 className={`h-4 w-4 ${t.completed ? "text-green-600" : "text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1">
                    <div className={t.completed ? "line-through text-muted-foreground" : "font-medium"}>{t.title}</div>
                    {t.due_date && <div className="text-xs text-muted-foreground">{new Date(t.due_date).toLocaleString()}</div>}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No tasks yet</p>}
            </div>
          </TabsContent>
        </Tabs>

        {output && (output.markdown || output.summary || output.results) && (
          <div className="mt-3 border-t pt-3 text-sm space-y-2">
            {output.summary && <div className="bg-muted/50 rounded p-3 whitespace-pre-wrap"><b>Summary:</b>{"\n"}{output.summary}</div>}
            {output.results && (
              <div className="space-y-1">
                {(Array.isArray(output.results) ? output.results : output.results?.web || []).slice(0, 5).map((r: any, i: number) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="block border rounded p-2 hover:bg-muted">
                    <div className="font-medium text-primary">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.description || r.snippet}</div>
                  </a>
                ))}
              </div>
            )}
            {output.markdown && !output.summary && (
              <pre className="bg-muted/50 rounded p-3 max-h-60 overflow-auto text-xs whitespace-pre-wrap">{output.markdown}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiToolAgent;
