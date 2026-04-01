import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, FolderPlus, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CropCycle {
  id: string;
  cycle_name: string;
  species: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface LedgerEntry {
  id: string;
  entry_type: string;
  category: string;
  amount: number;
  description: string | null;
  quantity_details: string | null;
  entry_date: string;
}

const EXPENSE_CATEGORIES = [
  { name: "Feed", color: "#0088FE" },
  { name: "Seed/PL", color: "#00C49F" },
  { name: "Electricity", color: "#FFBB28" },
  { name: "Labor", color: "#FF8042" },
  { name: "Medicine", color: "#8884D8" },
  { name: "Equipment", color: "#82CA9D" },
  { name: "Other", color: "#A4A4A4" },
];

const REVENUE_CATEGORIES = ["Shrimp Sale", "Fish Sale", "Crab Sale", "Other"];

const ProfitLossLedger = () => {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCycleName, setNewCycleName] = useState("");
  const [newCycleSpecies, setNewCycleSpecies] = useState("");
  const [showNewCycle, setShowNewCycle] = useState(false);

  const [newExpense, setNewExpense] = useState({ category: "Feed", amount: "", description: "" });
  const [newRevenue, setNewRevenue] = useState({ source: "Shrimp Sale", amount: "", quantity: "" });

  useEffect(() => {
    if (user) fetchCycles();
  }, [user]);

  useEffect(() => {
    if (selectedCycleId) fetchEntries();
  }, [selectedCycleId]);

  const fetchCycles = async () => {
    const { data, error } = await supabase
      .from("crop_cycles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCycles(data);
      if (data.length > 0 && !selectedCycleId) setSelectedCycleId(data[0].id);
    }
    setLoading(false);
  };

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("crop_cycle_id", selectedCycleId)
      .order("entry_date", { ascending: false });
    if (!error && data) setEntries(data);
  };

  const createCycle = async () => {
    if (!newCycleName || !user) return;
    const { error } = await supabase.from("crop_cycles").insert({
      user_id: user.id,
      cycle_name: newCycleName,
      species: newCycleSpecies || null,
    });
    if (error) { toast.error("Failed to create cycle"); return; }
    toast.success("Crop cycle created!");
    setNewCycleName("");
    setNewCycleSpecies("");
    setShowNewCycle(false);
    fetchCycles();
  };

  const completeCycle = async () => {
    if (!selectedCycleId) return;
    const { error } = await supabase.from("crop_cycles")
      .update({ status: "completed", end_date: new Date().toISOString().split("T")[0] })
      .eq("id", selectedCycleId);
    if (!error) { toast.success("Cycle marked complete"); fetchCycles(); }
  };

  const addExpense = async () => {
    if (!newExpense.amount || !user || !selectedCycleId) return;
    const { error } = await supabase.from("ledger_entries").insert({
      user_id: user.id,
      crop_cycle_id: selectedCycleId,
      entry_type: "expense",
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description || null,
    });
    if (error) { toast.error("Failed to add expense"); return; }
    setNewExpense({ category: "Feed", amount: "", description: "" });
    fetchEntries();
  };

  const addRevenue = async () => {
    if (!newRevenue.amount || !user || !selectedCycleId) return;
    const { error } = await supabase.from("ledger_entries").insert({
      user_id: user.id,
      crop_cycle_id: selectedCycleId,
      entry_type: "revenue",
      category: newRevenue.source,
      amount: parseFloat(newRevenue.amount),
      quantity_details: newRevenue.quantity || null,
    });
    if (error) { toast.error("Failed to add revenue"); return; }
    setNewRevenue({ source: "Shrimp Sale", amount: "", quantity: "" });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("ledger_entries").delete().eq("id", id);
    fetchEntries();
  };

  const expenses = entries.filter(e => e.entry_type === "expense");
  const revenues = entries.filter(e => e.entry_type === "revenue");
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? ((profit / totalExpenses) * 100).toFixed(1) : "0";

  const expenseChartData = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.name,
    value: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  })).filter(d => d.value > 0);

  const profitChartData = [
    { name: "Revenue", amount: totalRevenue, fill: "#22C55E" },
    { name: "Expenses", amount: totalExpenses, fill: "#EF4444" },
    { name: "Profit", amount: Math.max(0, profit), fill: "#3B82F6" },
  ];

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  if (loading) return <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Profit/Loss Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Crop Cycle Selector */}
        <div className="flex gap-2 items-end flex-wrap">
          {cycles.length > 0 && (
            <div className="flex-1 min-w-[160px]">
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.cycle_name} {c.species ? `(${c.species})` : ""} {c.status === "completed" ? "✅" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowNewCycle(!showNewCycle)}>
            <FolderPlus className="h-4 w-4 mr-1" /> New Cycle
          </Button>
          {selectedCycle?.status === "active" && (
            <Button size="sm" variant="outline" onClick={completeCycle}>
              <CheckCircle className="h-4 w-4 mr-1" /> Complete
            </Button>
          )}
        </div>

        {showNewCycle && (
          <div className="flex gap-2 flex-wrap p-3 bg-muted rounded-lg">
            <Input placeholder="Cycle name (e.g. Winter 2026)" value={newCycleName} onChange={e => setNewCycleName(e.target.value)} className="flex-1 min-w-[140px]" />
            <Input placeholder="Species (optional)" value={newCycleSpecies} onChange={e => setNewCycleSpecies(e.target.value)} className="w-40" />
            <Button size="sm" onClick={createCycle}>Create</Button>
          </div>
        )}

        {!selectedCycleId && cycles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Create your first crop cycle to start tracking expenses and revenue.</p>
          </div>
        )}

        {selectedCycleId && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg ${profit >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}>
                <p className="text-xs text-muted-foreground">Net Profit/Loss</p>
                <p className={`text-lg font-bold ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {profit >= 0 ? "+" : ""}₹{profit.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${parseFloat(roi) >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}>
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className={`text-lg font-bold ${parseFloat(roi) >= 0 ? "text-primary" : "text-red-600"}`}>{roi}%</p>
              </div>
            </div>

            {/* Charts */}
            {entries.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-[200px]">
                  <p className="text-sm font-medium mb-2">Expense Breakdown</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[200px]">
                  <p className="text-sm font-medium mb-2">Profit Overview</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      <Bar dataKey="amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <Tabs defaultValue="expenses">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses" className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" /> Expenses
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Revenue
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses" className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <select className="border rounded px-2 py-1 text-sm bg-background"
                    value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                  </select>
                  <Input type="number" placeholder="Amount (₹)" value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-28" />
                  <Input placeholder="Description" value={newExpense.description}
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="flex-1 min-w-[120px]" />
                  <Button size="sm" onClick={addExpense}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium text-sm">{expense.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">{expense.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">₹{expense.amount.toLocaleString()}</span>
                        <Button size="sm" variant="ghost" onClick={() => deleteEntry(expense.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No expenses yet</p>}
                </div>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <select className="border rounded px-2 py-1 text-sm bg-background"
                    value={newRevenue.source} onChange={e => setNewRevenue({ ...newRevenue, source: e.target.value })}>
                    {REVENUE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <Input type="number" placeholder="Amount (₹)" value={newRevenue.amount}
                    onChange={e => setNewRevenue({ ...newRevenue, amount: e.target.value })} className="w-28" />
                  <Input placeholder="Quantity (e.g. 2000 kg)" value={newRevenue.quantity}
                    onChange={e => setNewRevenue({ ...newRevenue, quantity: e.target.value })} className="flex-1 min-w-[100px]" />
                  <Button size="sm" onClick={addRevenue}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {revenues.map(revenue => (
                    <div key={revenue.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium text-sm">{revenue.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">{revenue.quantity_details}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">₹{revenue.amount.toLocaleString()}</span>
                        <Button size="sm" variant="ghost" onClick={() => deleteEntry(revenue.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                  {revenues.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No revenue yet</p>}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitLossLedger;
