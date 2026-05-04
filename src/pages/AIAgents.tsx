import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Droplets, Bug, Utensils, TrendingUp, Leaf, FlaskConical, Stethoscope, ListChecks, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AgentTaskRunner from "@/components/agents/AgentTaskRunner";
import { CometAgentDashboard } from "@/components/CometAgent";

const AGENTS = [
  {
    id: "water-quality",
    name: "Water Quality Advisor",
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "Analyze pH, DO, ammonia, salinity & get corrective action plans",
    systemPrompt: `You are an expert Water Quality Advisor for aquaculture ponds. Help farmers analyze water parameters (pH, dissolved oxygen, ammonia, nitrite, salinity, alkalinity, temperature) and provide specific corrective actions. Always give practical, step-by-step remedies with dosage recommendations.`,
    autoTasks: [
      { id: "wq-1", title: "Generate Daily Water Quality Checklist", prompt: "Create a comprehensive daily water quality monitoring checklist for a shrimp pond. Include ideal ranges for each parameter (pH, DO, ammonia, nitrite, salinity, alkalinity, temperature), when to check each, and red-flag values that need immediate action." },
      { id: "wq-2", title: "Analyze Common Water Issues & Solutions", prompt: "List the top 10 most common water quality problems in aquaculture ponds. For each, provide: the cause, symptoms to look for, immediate corrective action with exact dosages, and prevention tips." },
      { id: "wq-3", title: "Seasonal Water Management Calendar", prompt: "Create a month-by-month water management calendar for shrimp farming in India. Include seasonal parameter adjustments, mineral supplementation schedules, and weather-related precautions." },
      { id: "wq-4", title: "Emergency Water Crisis Protocols", prompt: "Provide emergency response protocols for: sudden pH crash, dissolved oxygen drop below 3 ppm, ammonia spike above 0.5 ppm, and algal bloom. Include step-by-step actions with timing and dosages." },
    ],
  },
  {
    id: "disease-detective",
    name: "Disease Detective",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-500/10",
    description: "Identify shrimp & fish diseases from symptoms and get treatment plans",
    systemPrompt: `You are a Disease Detective AI specializing in aquaculture diseases. Help farmers identify diseases in shrimp and fish from described symptoms. Provide diagnosis, treatment protocols with specific medicines and dosages, and prevention strategies.`,
    autoTasks: [
      { id: "dd-1", title: "Disease Identification Guide", prompt: "Create a comprehensive visual identification guide for the top 10 shrimp diseases (White Spot, EHP, Running Mortality, Loose Shell, White Gut, Black Gill, etc.). For each: list symptoms, mortality rate, and urgency level." },
      { id: "dd-2", title: "Treatment Protocols Database", prompt: "Generate a complete treatment protocol database for common shrimp diseases. Include medicine names, exact dosages per ton of water, treatment duration, withdrawal periods, and compatibility notes." },
      { id: "dd-3", title: "Biosecurity Checklist", prompt: "Create a farm-level biosecurity checklist covering: pond preparation, seed selection, water treatment, visitor protocols, equipment sanitization, and quarantine procedures." },
      { id: "dd-4", title: "Disease Prevention Calendar", prompt: "Create a crop-cycle disease prevention calendar from pond preparation to harvest. Include prophylactic treatments, immune boosters, probiotic schedules, and stress reduction measures at each stage." },
    ],
  },
  {
    id: "feed-optimizer",
    name: "Feed Optimizer",
    icon: Utensils,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description: "Optimize feed schedules, FCR, and reduce feed costs",
    systemPrompt: `You are a Feed Optimization AI for aquaculture. Help farmers optimize feed schedules, calculate proper feed quantities based on biomass, improve FCR, recommend feed types for different growth stages, and minimize feed wastage.`,
    autoTasks: [
      { id: "fo-1", title: "Optimal Feed Schedule by Growth Stage", prompt: "Create a detailed feeding schedule for Vannamei shrimp from PL10 to harvest. Include feed type, protein %, meal frequency, feed rate as % body weight, and tray check times for each DOC (day of culture) range." },
      { id: "fo-2", title: "FCR Improvement Strategies", prompt: "List 15 proven strategies to improve Feed Conversion Ratio (FCR) in shrimp farming. Include specific actions, expected FCR improvement, and cost-benefit analysis for each." },
      { id: "fo-3", title: "Feed Cost Reduction Plan", prompt: "Create a feed cost optimization plan including: bulk buying strategies, feed storage best practices, reducing wastage techniques, supplement alternatives, and seasonal cost variations." },
      { id: "fo-4", title: "Feeding During Stress Events", prompt: "Provide feeding protocols during: weather changes, disease outbreaks, molting periods, low DO events, and high ammonia. Include feed reduction percentages and recovery feeding plans." },
    ],
  },
  {
    id: "market-analyst",
    name: "Market Price Analyst",
    icon: TrendingUp,
    color: "text-green-500",
    bg: "bg-green-500/10",
    description: "Get market insights, best selling times, and pricing strategies",
    systemPrompt: `You are a Market Price Analyst for aquaculture products. Help farmers understand market trends, best times to sell, pricing strategies based on count/size, and negotiation tips.`,
    autoTasks: [
      { id: "ma-1", title: "Current Market Trends Report", prompt: "Generate a market analysis report for Indian shrimp markets. Cover: price trends by count size (20, 30, 40, 50, 60, 70, 80, 100 count), regional price differences, export vs domestic demand, and seasonal patterns." },
      { id: "ma-2", title: "Optimal Harvest Size Calculator", prompt: "Create a harvest decision framework: at what count/size should farmers harvest for maximum profit? Factor in: current market prices by count, feed costs to grow bigger, mortality risk, and pond opportunity cost." },
      { id: "ma-3", title: "Price Negotiation Strategies", prompt: "Provide 10 proven negotiation strategies for shrimp farmers selling to traders/processors. Include: timing tactics, quality premiums to demand, bulk selling advantages, and direct buyer connections." },
      { id: "ma-4", title: "Export Market Opportunities", prompt: "Analyze export opportunities for Indian shrimp farmers. Cover: key importing countries, required certifications (BAP, ASC), quality standards, export process steps, and premium price differences." },
    ],
  },
  {
    id: "pond-planner",
    name: "Pond Culture Planner",
    icon: Leaf,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description: "Plan stocking density, culture cycles, and pond preparation",
    systemPrompt: `You are a Pond Culture Planning AI. Help farmers plan pond preparation, stocking density calculations, culture cycle timelines, species selection, biofloc setup, and seasonal planning.`,
    autoTasks: [
      { id: "pp-1", title: "New Crop Planning Guide", prompt: "Create a complete new crop planning guide from Day -30 to Day 0 (stocking day). Include: pond drying, liming, water filling, fertilization, plankton development, water parameter targets before stocking, and seed quality checks." },
      { id: "pp-2", title: "Stocking Density Calculator", prompt: "Provide stocking density recommendations for different scenarios: intensive, semi-intensive, and extensive culture. Include tables for pond size vs stocking count, expected survival rates, and production estimates." },
      { id: "pp-3", title: "Week-by-Week Culture Plan", prompt: "Generate a detailed week-by-week culture management plan for a 120-day Vannamei shrimp crop. Include: water management, feeding, mineral supplementation, probiotic application, sampling schedule, and growth milestones." },
      { id: "pp-4", title: "Multi-Crop Annual Calendar", prompt: "Plan an annual multi-crop calendar for maximum pond utilization. Include: optimal cropping seasons, monsoon precautions, inter-crop maintenance, and revenue projections for 2-3 crops per year." },
    ],
  },
  {
    id: "lab-assistant",
    name: "Lab & Chemistry Assistant",
    icon: FlaskConical,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description: "Help with mineral dosing, probiotics schedules, and chemical treatments",
    systemPrompt: `You are a Lab & Chemistry Assistant for aquaculture. Help farmers with mineral dosing calculations, probiotic application schedules, chemical treatment protocols, and soil/water chemistry.`,
    autoTasks: [
      { id: "la-1", title: "Complete Mineral Dosing Guide", prompt: "Create a comprehensive mineral dosing guide for shrimp farming. Cover: calcium, magnesium, potassium, sodium, EDTA, dolomite, and trace minerals. Include dosages per acre, frequency, and water parameter targets." },
      { id: "la-2", title: "Probiotic Application Schedule", prompt: "Generate a complete probiotic management plan throughout the crop cycle. Include: types of probiotics (soil, water, gut), brands commonly used, application rates, timing, and storage guidelines." },
      { id: "la-3", title: "Chemical Safety & Compatibility Chart", prompt: "Create a chemical compatibility chart for common aquaculture chemicals. Include: which chemicals can be mixed, minimum intervals between applications, and safety precautions for each." },
      { id: "la-4", title: "Soil & Water Analysis Interpretation", prompt: "Explain how to interpret soil and water analysis reports. Cover: ideal values for each parameter, what deviations mean, corrective actions for each parameter, and how often to test." },
    ],
  },
  {
    id: "vet-advisor",
    name: "Aqua Vet Advisor",
    icon: Stethoscope,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    description: "Get veterinary-grade advice on antibiotics, probiotics & biosecurity",
    systemPrompt: `You are an Aqua Veterinary Advisor. Provide veterinary-grade advice on antibiotic usage, probiotic protocols, biosecurity measures, quarantine procedures, and health management strategies.`,
    autoTasks: [
      { id: "va-1", title: "Antibiotic Usage & Withdrawal Guide", prompt: "Create a comprehensive guide on antibiotic use in aquaculture. Cover: approved antibiotics, dosages, withdrawal periods, resistance concerns, alternatives to antibiotics, and regulatory compliance." },
      { id: "va-2", title: "Health Monitoring Protocols", prompt: "Generate weekly health monitoring protocols including: behavioral observation checklist, sampling methods, gut health assessment, hepatopancreas checks, and when to call a vet." },
      { id: "va-3", title: "Immune Booster Program", prompt: "Design an immune boosting program for shrimp/fish throughout the culture cycle. Include: immunostimulants, herbal supplements, vitamins, nucleotides, and beta-glucans with dosages and timing." },
      { id: "va-4", title: "Post-Disease Recovery Plan", prompt: "Create recovery plans for ponds after disease outbreaks. Cover: water treatment, biofloc recovery, re-stocking decisions, nutrition programs for survivors, and lessons-learned documentation." },
    ],
  },
  {
    id: "browser-agent",
    name: "Comet Browser Agent",
    icon: Globe,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    description: "Autonomous agent that browses, researches, collects data & completes tasks end-to-end",
    systemPrompt: `You are the Comet Browser Agent — an autonomous AI assistant that acts as if it can browse the internet, search for information, collect data, compare products, fill forms, and complete multi-step tasks for aqua farmers. You simulate browsing by providing comprehensive, up-to-date research results. When given a task, break it down into steps (Search → Navigate → Extract → Compile → Report) and present results as if you browsed and collected them live. Always show your step-by-step workflow with status indicators. Format output as actionable reports with links, prices, contacts, and recommendations.`,
    autoTasks: [
      { id: "ba-1", title: "Research Best Shrimp Feed Brands & Prices", prompt: "Act as a browser agent: Search for the top 10 shrimp feed brands available in India. For each brand, find: product name, protein %, price per kg, availability (online/offline), and farmer reviews. Compare them in a table and give a final recommendation for best value-for-money." },
      { id: "ba-2", title: "Find Government Subsidies & Schemes", prompt: "Browse and compile all active government subsidies, schemes, and grants available for aquaculture farmers in India (central + state-wise). For each scheme: name, eligibility criteria, subsidy amount, application process, deadline, and official website/contact. Present as a comprehensive guide." },
      { id: "ba-3", title: "Competitor Market Price Survey", prompt: "Conduct a market survey: Search for current shrimp prices across all major Indian markets (Bhimavaram, Nellore, Chennai, Kolkata, Mumbai, Gujarat). For each market: current price by count (20/30/40/50/60/80/100), trend (up/down/stable), and best time to sell. Compile into an actionable pricing dashboard." },
      { id: "ba-4", title: "Equipment & Supplier Directory", prompt: "Browse and create a comprehensive directory of aquaculture equipment suppliers in India. Cover: aerators, auto-feeders, water testing kits, pond liners, and IoT sensors. For each supplier: company name, products offered, price range, location, contact info, and delivery options. Rank by farmer satisfaction." },
      { id: "ba-5", title: "Latest Aquaculture Research & News", prompt: "Browse the latest aquaculture research papers, news articles, and industry updates from the past month. Summarize the top 15 most relevant findings for Indian shrimp farmers. Include: new disease outbreaks reported, technology innovations, policy changes, export market updates, and upcoming aquaculture events/conferences." },
    ],
  },
];

const AIAgents = () => {
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);

  if (selectedAgent) {
    return <AgentTaskRunner agent={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          <Bot className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold">AI Agents</h1>
            <p className="text-sm opacity-90">Autonomous AI assistants — they do the work for you</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-3">
        <p className="text-sm text-muted-foreground">
          Select an agent and click <strong>"Run All Tasks"</strong> — the AI will automatically generate reports, checklists, and action plans without any input needed.
        </p>

        <CometAgentDashboard />


        {AGENTS.map(agent => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAgent(agent)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${agent.bg}`}>
                  <Icon className={`h-6 w-6 ${agent.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ListChecks className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{agent.autoTasks.length} automated tasks</span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">Auto</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AIAgents;
