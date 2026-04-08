import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Landmark, Eye, Building2 } from "lucide-react";

interface PartnerBank {
  id: string;
  bank_name: string;
  logo_url: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  max_loan_amount: number | null;
  min_loan_amount: number | null;
  loan_types: string[];
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
}

interface LoanApplication {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  farm_location: string;
  farm_size_acres: number;
  species_cultivated: string | null;
  years_in_aquaculture: number;
  annual_revenue: number | null;
  loan_amount_requested: number;
  loan_purpose: string;
  existing_loans_amount: number;
  collateral_details: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  bank_id: string;
  user_id: string;
}

const AdminBankLoans = () => {
  const { toast } = useToast();
  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showAppDialog, setShowAppDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [editingBank, setEditingBank] = useState<PartnerBank | null>(null);
  const [bankForm, setBankForm] = useState({
    bank_name: "",
    interest_rate_min: "",
    interest_rate_max: "",
    max_loan_amount: "",
    min_loan_amount: "50000",
    loan_types: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    requirements: "",
  });

  useEffect(() => {
    fetchBanks();
    fetchApplications();
  }, []);

  const fetchBanks = async () => {
    const { data } = await supabase.from("partner_banks").select("*").order("created_at", { ascending: false });
    if (data) setBanks(data as PartnerBank[]);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from("loan_applications").select("*").order("created_at", { ascending: false });
    if (data) setApplications(data as LoanApplication[]);
  };

  const handleSaveBank = async () => {
    const payload = {
      bank_name: bankForm.bank_name,
      interest_rate_min: bankForm.interest_rate_min ? Number(bankForm.interest_rate_min) : null,
      interest_rate_max: bankForm.interest_rate_max ? Number(bankForm.interest_rate_max) : null,
      max_loan_amount: bankForm.max_loan_amount ? Number(bankForm.max_loan_amount) : null,
      min_loan_amount: bankForm.min_loan_amount ? Number(bankForm.min_loan_amount) : 50000,
      loan_types: bankForm.loan_types.split(",").map(s => s.trim()).filter(Boolean),
      description: bankForm.description || null,
      contact_email: bankForm.contact_email || null,
      contact_phone: bankForm.contact_phone || null,
      requirements: bankForm.requirements || null,
    };

    if (editingBank) {
      const { error } = await supabase.from("partner_banks").update(payload).eq("id", editingBank.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Bank updated successfully" });
    } else {
      const { error } = await supabase.from("partner_banks").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Bank added successfully" });
    }
    setShowBankDialog(false);
    setEditingBank(null);
    resetBankForm();
    fetchBanks();
  };

  const resetBankForm = () => {
    setBankForm({ bank_name: "", interest_rate_min: "", interest_rate_max: "", max_loan_amount: "", min_loan_amount: "50000", loan_types: "", description: "", contact_email: "", contact_phone: "", requirements: "" });
  };

  const handleEditBank = (bank: PartnerBank) => {
    setEditingBank(bank);
    setBankForm({
      bank_name: bank.bank_name,
      interest_rate_min: bank.interest_rate_min?.toString() || "",
      interest_rate_max: bank.interest_rate_max?.toString() || "",
      max_loan_amount: bank.max_loan_amount?.toString() || "",
      min_loan_amount: bank.min_loan_amount?.toString() || "50000",
      loan_types: bank.loan_types?.join(", ") || "",
      description: bank.description || "",
      contact_email: bank.contact_email || "",
      contact_phone: bank.contact_phone || "",
      requirements: bank.requirements || "",
    });
    setShowBankDialog(true);
  };

  const handleDeleteBank = async (id: string) => {
    const { error } = await supabase.from("partner_banks").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Bank removed" });
    fetchBanks();
  };

  const handleToggleBank = async (id: string, active: boolean) => {
    await supabase.from("partner_banks").update({ is_active: !active }).eq("id", id);
    fetchBanks();
  };

  const handleUpdateAppStatus = async (id: string, status: string, notes?: string) => {
    const update: Record<string, string> = { status };
    if (notes !== undefined) update.admin_notes = notes;
    const { error } = await supabase.from("loan_applications").update(update).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    
    // Send notification to farmer
    try {
      await supabase.functions.invoke("send-loan-status-notification", {
        body: { applicationId: id, newStatus: status, adminNotes: notes },
      });
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }
    
    toast({ title: `Application ${status}` });
    fetchApplications();
    setShowAppDialog(false);
  };

  const getBankName = (bankId: string) => banks.find(b => b.id === bankId)?.bank_name || "Unknown";

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    if (s === "under_review") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="banks">
        <TabsList>
          <TabsTrigger value="banks"><Building2 className="h-4 w-4 mr-1" />Partner Banks</TabsTrigger>
          <TabsTrigger value="applications"><Landmark className="h-4 w-4 mr-1" />Loan Applications ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Partner Banks</h3>
            <Button onClick={() => { resetBankForm(); setEditingBank(null); setShowBankDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Bank
            </Button>
          </div>

          {banks.map(bank => (
            <Card key={bank.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{bank.bank_name}</h4>
                      <Badge variant={bank.is_active ? "default" : "secondary"}>{bank.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    {bank.interest_rate_min && <p className="text-sm text-muted-foreground">Interest: {bank.interest_rate_min}% - {bank.interest_rate_max}%</p>}
                    {bank.max_loan_amount && <p className="text-sm text-muted-foreground">Max Loan: ₹{Number(bank.max_loan_amount).toLocaleString()}</p>}
                    {bank.loan_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bank.loan_types.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleBank(bank.id, bank.is_active)}>
                      {bank.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditBank(bank)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteBank(bank.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {banks.length === 0 && <p className="text-center text-muted-foreground py-8">No partner banks added yet.</p>}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <h3 className="text-lg font-semibold">Loan Applications</h3>
          {applications.map(app => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold">{app.full_name}</h4>
                    <p className="text-sm text-muted-foreground">Bank: {getBankName(app.bank_id)} • ₹{Number(app.loan_amount_requested).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Purpose: {app.loan_purpose}</p>
                    <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(app.status)}>{app.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowAppDialog(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {applications.length === 0 && <p className="text-center text-muted-foreground py-8">No loan applications yet.</p>}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Bank Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBank ? "Edit Bank" : "Add Partner Bank"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Bank Name *</Label><Input value={bankForm.bank_name} onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Interest Rate (%)</Label><Input type="number" value={bankForm.interest_rate_min} onChange={e => setBankForm(p => ({ ...p, interest_rate_min: e.target.value }))} /></div>
              <div><Label>Max Interest Rate (%)</Label><Input type="number" value={bankForm.interest_rate_max} onChange={e => setBankForm(p => ({ ...p, interest_rate_max: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Loan Amount (₹)</Label><Input type="number" value={bankForm.min_loan_amount} onChange={e => setBankForm(p => ({ ...p, min_loan_amount: e.target.value }))} /></div>
              <div><Label>Max Loan Amount (₹)</Label><Input type="number" value={bankForm.max_loan_amount} onChange={e => setBankForm(p => ({ ...p, max_loan_amount: e.target.value }))} /></div>
            </div>
            <div><Label>Loan Types (comma separated)</Label><Input placeholder="Crop Loan, Equipment Loan, Working Capital" value={bankForm.loan_types} onChange={e => setBankForm(p => ({ ...p, loan_types: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={bankForm.description} onChange={e => setBankForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Email</Label><Input value={bankForm.contact_email} onChange={e => setBankForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
              <div><Label>Contact Phone</Label><Input value={bankForm.contact_phone} onChange={e => setBankForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
            </div>
            <div><Label>Requirements</Label><Textarea placeholder="Documents needed, eligibility criteria..." value={bankForm.requirements} onChange={e => setBankForm(p => ({ ...p, requirements: e.target.value }))} /></div>
            <Button onClick={handleSaveBank} className="w-full" disabled={!bankForm.bank_name}>{editingBank ? "Update Bank" : "Add Bank"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog open={showAppDialog} onOpenChange={setShowAppDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Loan Application Details</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedApp.full_name}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedApp.phone}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedApp.email || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Bank</p><p className="font-medium">{getBankName(selectedApp.bank_id)}</p></div>
                <div><p className="text-muted-foreground">Loan Amount</p><p className="font-medium">₹{Number(selectedApp.loan_amount_requested).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Purpose</p><p className="font-medium">{selectedApp.loan_purpose}</p></div>
                <div><p className="text-muted-foreground">Farm Location</p><p className="font-medium">{selectedApp.farm_location}</p></div>
                <div><p className="text-muted-foreground">Farm Size</p><p className="font-medium">{selectedApp.farm_size_acres} acres</p></div>
                <div><p className="text-muted-foreground">Species</p><p className="font-medium">{selectedApp.species_cultivated || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Experience</p><p className="font-medium">{selectedApp.years_in_aquaculture} years</p></div>
                <div><p className="text-muted-foreground">Annual Revenue</p><p className="font-medium">{selectedApp.annual_revenue ? `₹${Number(selectedApp.annual_revenue).toLocaleString()}` : "N/A"}</p></div>
                <div><p className="text-muted-foreground">Existing Loans</p><p className="font-medium">₹{Number(selectedApp.existing_loans_amount).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Aadhaar</p><p className="font-medium">{selectedApp.aadhaar_number || "N/A"}</p></div>
                <div><p className="text-muted-foreground">PAN</p><p className="font-medium">{selectedApp.pan_number || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Bank A/C</p><p className="font-medium">{selectedApp.bank_account_number || "N/A"}</p></div>
                <div><p className="text-muted-foreground">IFSC</p><p className="font-medium">{selectedApp.ifsc_code || "N/A"}</p></div>
              </div>
              {selectedApp.collateral_details && (
                <div><p className="text-sm text-muted-foreground">Collateral</p><p className="text-sm">{selectedApp.collateral_details}</p></div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleUpdateAppStatus(selectedApp.id, "approved")}>Approve</Button>
                <Button className="flex-1" variant="secondary" onClick={() => handleUpdateAppStatus(selectedApp.id, "under_review")}>Under Review</Button>
                <Button className="flex-1" variant="destructive" onClick={() => handleUpdateAppStatus(selectedApp.id, "rejected")}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBankLoans;
