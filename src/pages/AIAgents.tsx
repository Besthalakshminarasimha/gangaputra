import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Droplets, Bug, Utensils, TrendingUp, Leaf, FlaskConical, Stethoscope, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";


const AGENTS = [
  {
    id: "water-quality",
    name: "Water Quality Advisor",
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "Analyze pH, DO, ammonia, salinity & get corrective action plans",
    systemPrompt: `You are an expert Water Quality Advisor for aquaculture ponds. Help farmers analyze water parameters (pH, dissolved oxygen, ammonia, nitrite, salinity, alkalinity, temperature) and provide specific corrective actions. Always give practical, step-by-step remedies with dosage recommendations. Reference GANGAPUTRA's Water Parameters form on the Farm page for logging.`,
  },
  {
    id: "disease-detective",
    name: "Disease Detective",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-500/10",
    description: "Identify shrimp & fish diseases from symptoms and get treatment plans",
    systemPrompt: `You are a Disease Detective AI specializing in aquaculture diseases. Help farmers identify diseases in shrimp (White Spot, EHP, Running Mortality, Loose Shell, etc.) and fish from described symptoms. Provide diagnosis, treatment protocols with specific medicines and dosages, and prevention strategies. Reference GANGAPUTRA's AI Disease Predictor and Medicine Directory for further help.`,
  },
  {
    id: "feed-optimizer",
    name: "Feed Optimizer",
    icon: Utensils,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description: "Optimize feed schedules, FCR, and reduce feed costs",
    systemPrompt: `You are a Feed Optimization AI for aquaculture. Help farmers optimize feed schedules, calculate proper feed quantities based on biomass, improve FCR (Feed Conversion Ratio), recommend feed types for different growth stages, and minimize feed wastage. Reference GANGAPUTRA's Smart Feed Calculator and Store for buying feed.`,
  },
  {
    id: "market-analyst",
    name: "Market Price Analyst",
    icon: TrendingUp,
    color: "text-green-500",
    bg: "bg-green-500/10",
    description: "Get market insights, best selling times, and pricing strategies",
    systemPrompt: `You are a Market Price Analyst for aquaculture products (shrimp, fish, crab). Help farmers understand market trends, best times to sell, pricing strategies based on count/size, and negotiation tips. Reference GANGAPUTRA's live shrimp rates on Dashboard and Price Alerts feature.`,
  },
  {
    id: "pond-planner",
    name: "Pond Culture Planner",
    icon: Leaf,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description: "Plan stocking density, culture cycles, and pond preparation",
    systemPrompt: `You are a Pond Culture Planning AI. Help farmers plan pond preparation, stocking density calculations, culture cycle timelines, species selection, biofloc setup, and seasonal planning. Provide detailed week-by-week culture plans. Reference GANGAPUTRA's Crop Manuals in Aquapedia.`,
  },
  {
    id: "lab-assistant",
    name: "Lab & Chemistry Assistant",
    icon: FlaskConical,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description: "Help with mineral dosing, probiotics schedules, and chemical treatments",
    systemPrompt: `You are a Lab & Chemistry Assistant for aquaculture. Help farmers with mineral dosing calculations, probiotic application schedules, chemical treatment protocols (for lime, bleach, EDTA, etc.), molarity calculations, and soil/water chemistry. Reference GANGAPUTRA's Molarity Calculator and Store for purchasing chemicals.`,
  },
  {
    id: "vet-advisor",
    name: "Aqua Vet Advisor",
    icon: Stethoscope,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    description: "Get veterinary-grade advice on antibiotics, probiotics & biosecurity",
    systemPrompt: `You are an Aqua Veterinary Advisor. Provide veterinary-grade advice on antibiotic usage (withdrawal periods, dosages), probiotic protocols, biosecurity measures, quarantine procedures, and health management strategies for aquaculture. Reference GANGAPUTRA's Doctor Directory to book appointments with real aqua vets.`,
  },
];

type Message = { role: "user" | "assistant"; content: string };

const AIAgents = () => {
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectAgent = (agent: typeof AGENTS[0]) => {
    setSelectedAgent(agent);
    setMessages([]);
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgent || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, agentPrompt: selectedAgent.systemPrompt }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to connect to AI agent");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

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
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." }]);
    }
    setIsLoading(false);
  };

  if (selectedAgent) {
    const AgentIcon = selectedAgent.icon;
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        <div className={`${selectedAgent.bg} border-b p-4`}>
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}><ArrowLeft className="h-5 w-5" /></Button>
            <AgentIcon className={`h-6 w-6 ${selectedAgent.color}`} />
            <div>
              <h1 className="font-bold">{selectedAgent.name}</h1>
              <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AgentIcon className={`h-12 w-12 mx-auto mb-3 ${selectedAgent.color} opacity-50`} />
              <p className="text-sm">Ask me anything about {selectedAgent.name.toLowerCase()}!</p>
            </div>
          )}
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3 max-w-2xl mx-auto w-full">
          <div className="flex gap-2">
            <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask ${selectedAgent.name}...`}
              className="min-h-[44px] max-h-[120px] resize-none" rows={1}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-[44px] w-[44px]">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          <Bot className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold">AI Agents</h1>
            <p className="text-sm opacity-90">Specialized AI assistants for aqua farming</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-3">
        <p className="text-sm text-muted-foreground">Choose a specialized AI agent to get expert guidance on specific aspects of your aquaculture operations.</p>
        
        {AGENTS.map(agent => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectAgent(agent)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${agent.bg}`}>
                  <Icon className={`h-6 w-6 ${agent.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">Chat</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AIAgents;
