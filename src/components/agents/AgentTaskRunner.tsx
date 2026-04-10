import { useState, useRef } from "react";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Play, RotateCcw, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type TaskStatus = "pending" | "running" | "done" | "error";

interface AgentTask {
  id: string;
  title: string;
  status: TaskStatus;
  result?: string;
  prompt: string;
}

interface AgentConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  description: string;
  systemPrompt: string;
  autoTasks: { id: string; title: string; prompt: string }[];
}

interface AgentTaskRunnerProps {
  agent: AgentConfig;
  onBack: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const AgentTaskRunner = ({ agent, onBack }: AgentTaskRunnerProps) => {
  const AgentIcon = agent.icon;
  const [tasks, setTasks] = useState<AgentTask[]>(
    agent.autoTasks.map(t => ({ ...t, status: "pending" as TaskStatus }))
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const runSingleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setActiveTaskId(taskId);
    setExpandedTasks(prev => new Set(prev).add(taskId));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "running", result: undefined } : t));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      // Build messages with optional image
      const userContent: any[] = [];
      if (uploadedImage) {
        userContent.push({ type: "image_url", image_url: { url: uploadedImage } });
        userContent.push({ type: "text", text: task.prompt + "\n\nAnalyze the uploaded image along with this task. Reference what you observe in the image in your report." });
      } else {
        userContent.push({ type: "text", text: task.prompt });
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userContent }],
          agentPrompt: agent.systemPrompt + "\n\nProvide a comprehensive, actionable report. Use markdown formatting with headers, bullet points, and tables where appropriate. Be specific with numbers, dosages, and recommendations." + (uploadedImage ? "\n\nThe user has uploaded an image. Analyze it carefully and incorporate your observations into your response." : ""),
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) throw new Error("AI request failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResult += content;
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, result: fullResult } : t));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done", result: fullResult } : t));
      return true;
    } catch (e: any) {
      if (e.name === "AbortError") return false;
      console.error(e);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "error", result: "Failed to complete this task. Please retry." } : t));
      return false;
    }
  };

  const runAllTasks = async () => {
    setIsRunningAll(true);
    setTasks(prev => prev.map(t => ({ ...t, status: "pending", result: undefined })));
    
    for (const task of tasks) {
      const success = await runSingleTask(task.id);
      if (success === false && abortRef.current?.signal.aborted) break;
    }
    setIsRunningAll(false);
    toast.success(`${agent.name} completed all tasks!`);
  };

  const completedCount = tasks.filter(t => t.status === "done").length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className={`${agent.bg} border-b p-4`}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AgentIcon className={`h-6 w-6 ${agent.color}`} />
          <div className="flex-1">
            <h1 className="font-bold">{agent.name}</h1>
            <p className="text-xs text-muted-foreground">{agent.description}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount} done
          </Badge>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full">
        {/* Image Upload Section */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Uploaded"
                className="h-20 w-20 object-cover rounded-lg border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">Image attached to all tasks</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              Attach Image (optional)
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={runAllTasks}
            disabled={isRunningAll}
            className="flex-1"
            variant="default"
          >
            {isRunningAll ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running...</>
            ) : completedCount === totalCount && completedCount > 0 ? (
              <><RotateCcw className="h-4 w-4 mr-2" /> Re-run All Tasks</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Run All Tasks Automatically</>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3">
            {tasks.map((task, index) => (
               <Card
                key={task.id}
                className={`transition-all cursor-pointer ${
                  expandedTasks.has(task.id) || activeTaskId === task.id ? "ring-2 ring-primary/30" : ""
                } ${task.status === "done" ? "border-green-500/30" : task.status === "error" ? "border-red-500/30" : ""}`}
                onClick={() => toggleTask(task.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : task.status === "running" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : task.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.status === "done" ? "✅ Completed" : task.status === "running" ? "⏳ Working..." : task.status === "error" ? "❌ Failed" : "⏸️ Pending"}
                      </p>
                    </div>
                    {task.status !== "running" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); runSingleTask(task.id); }}
                        disabled={isRunningAll}
                      >
                        {task.status === "done" ? <RotateCcw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>

                  {(expandedTasks.has(task.id) || activeTaskId === task.id) && task.result && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{task.result}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AgentTaskRunner;
