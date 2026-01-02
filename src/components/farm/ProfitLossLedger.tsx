import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description: string;
}

interface RevenueItem {
  id: string;
  source: string;
  amount: number;
  quantity: string;
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

const ProfitLossLedger = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: "1", category: "Feed", amount: 250000, description: "Vannamei feed" },
    { id: "2", category: "Seed/PL", amount: 80000, description: "PL stock" },
    { id: "3", category: "Electricity", amount: 45000, description: "3 months" },
    { id: "4", category: "Labor", amount: 60000, description: "Workers salary" },
  ]);
  
  const [revenues, setRevenues] = useState<RevenueItem[]>([
    { id: "1", source: "Shrimp Sale", amount: 550000, quantity: "2000 kg @ ₹275/kg" },
  ]);

  const [newExpense, setNewExpense] = useState({ category: "Feed", amount: "", description: "" });
  const [newRevenue, setNewRevenue] = useState({ source: "", amount: "", quantity: "" });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? ((profit / totalExpenses) * 100).toFixed(1) : 0;

  const expenseChartData = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.name,
    value: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color
  })).filter(d => d.value > 0);

  const profitChartData = [
    { name: "Revenue", amount: totalRevenue, fill: "#22C55E" },
    { name: "Expenses", amount: totalExpenses, fill: "#EF4444" },
    { name: "Profit", amount: Math.max(0, profit), fill: "#3B82F6" },
  ];

  const addExpense = () => {
    if (!newExpense.amount) return;
    setExpenses([...expenses, {
      id: Date.now().toString(),
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description
    }]);
    setNewExpense({ category: "Feed", amount: "", description: "" });
  };

  const addRevenue = () => {
    if (!newRevenue.amount || !newRevenue.source) return;
    setRevenues([...revenues, {
      id: Date.now().toString(),
      source: newRevenue.source,
      amount: parseFloat(newRevenue.amount),
      quantity: newRevenue.quantity
    }]);
    setNewRevenue({ source: "", amount: "", quantity: "" });
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const removeRevenue = (id: string) => {
    setRevenues(revenues.filter(r => r.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Profit/Loss Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs text-muted-foreground">Net Profit/Loss</p>
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${parseFloat(String(roi)) >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={`text-lg font-bold ${parseFloat(String(roi)) >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {roi}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-[200px]">
            <p className="text-sm font-medium mb-2">Expense Breakdown</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
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
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            {/* Add Expense */}
            <div className="flex gap-2 flex-wrap">
              <select 
                className="border rounded px-2 py-1 text-sm"
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Amount (₹)"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                className="w-28"
              />
              <Input
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="flex-1 min-w-[120px]"
              />
              <Button size="sm" onClick={addExpense}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Expense List */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{expense.category}</span>
                    <span className="text-xs text-muted-foreground ml-2">{expense.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">₹{expense.amount.toLocaleString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeExpense(expense.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            {/* Add Revenue */}
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Source"
                value={newRevenue.source}
                onChange={(e) => setNewRevenue({...newRevenue, source: e.target.value})}
                className="flex-1 min-w-[100px]"
              />
              <Input
                type="number"
                placeholder="Amount (₹)"
                value={newRevenue.amount}
                onChange={(e) => setNewRevenue({...newRevenue, amount: e.target.value})}
                className="w-28"
              />
              <Input
                placeholder="Quantity details"
                value={newRevenue.quantity}
                onChange={(e) => setNewRevenue({...newRevenue, quantity: e.target.value})}
                className="flex-1 min-w-[100px]"
              />
              <Button size="sm" onClick={addRevenue}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Revenue List */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {revenues.map(revenue => (
                <div key={revenue.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{revenue.source}</span>
                    <span className="text-xs text-muted-foreground ml-2">{revenue.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">₹{revenue.amount.toLocaleString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeRevenue(revenue.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfitLossLedger;
