import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, Building2, ChevronRight, FileText, Clock, Calculator, Upload, X, Loader2 } from "lucide-react";

interface PartnerBank {
  id: string;
  bank_name: string;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  max_loan_amount: number | null;
  min_loan_amount: number | null;
  loan_types: string[];
  description: string | null;
  contact_phone: string | null;
  requirements: string | null;
  is_active: boolean;
}

interface MyApplication {
  id: string;
  loan_amount_requested: number;
  loan_purpose: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  bank_id: string;
}

// EMI Calculator Component
const EMICalculator = () => {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");

  const calcEMI = () => {
    const P = Number(principal);
    const R = Number(rate) / 12 / 100;
    const N = Number(tenure);
    if (!P || !R || !N) return null;
    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return { emi: Math.round(emi), totalPayment: Math.round(emi * N), totalInterest: Math.round(emi * N - P) };
  };

  const result = calcEMI();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          EMI Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Loan Amount (₹)</Label>
            <Input type="number" placeholder="500000" value={principal} onChange={e => setPrincipal(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Interest Rate (%/yr)</Label>
            <Input type="number" placeholder="8.5" value={rate} onChange={e => setRate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Tenure (months)</Label>
            <Input type="number" placeholder="36" value={tenure} onChange={e => setTenure(e.target.value)} />
          </div>
        </div>
        {result && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Monthly EMI</p>
              <p className="font-bold text-primary">₹{result.emi.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Total Payment</p>
              <p className="font-bold">₹{result.totalPayment.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="font-bold text-destructive">₹{result.totalInterest.toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BankLoanSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [selectedBank, setSelectedBank] = useState<PartnerBank | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", farm_location: "", farm_size_acres: "",
    species_cultivated: "", years_in_aquaculture: "", annual_revenue: "",
    loan_amount_requested: "", loan_purpose: "", existing_loans_amount: "0",
    collateral_details: "", aadhaar_number: "", pan_number: "",
    bank_account_number: "", ifsc_code: "",
  });

  useEffect(() => {
    fetchBanks();
    if (user) fetchMyApplications();
  }, [user]);

  const fetchBanks = async () => {
    const { data } = await supabase.from("partner_banks").select("*").eq("is_active", true);
    if (data) setBanks(data as PartnerBank[]);
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    const { data } = await supabase.from("loan_applications").select("id, loan_amount_requested, loan_purpose, status, admin_notes, created_at, bank_id").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setMyApps(data as MyApplication[]);
  };

  const handleApply = (bank: PartnerBank) => {
    setSelectedBank(bank);
    setUploadedFiles([]);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} exceeds 5MB limit`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `kyc/${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("content").upload(path, file);
      if (error) {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from("content").getPublicUrl(path);
        setUploadedFiles(prev => [...prev, { name: file.name, url: urlData.publicUrl }]);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user || !selectedBank) return;
    if (!form.full_name || !form.phone || !form.farm_location || !form.farm_size_acres || !form.loan_amount_requested || !form.loan_purpose) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const docUrls = uploadedFiles.map(f => f.url).join(", ");
    const { error } = await supabase.from("loan_applications").insert({
      user_id: user.id,
      bank_id: selectedBank.id,
      full_name: form.full_name,
      phone: form.phone,
      email: form.email || null,
      farm_location: form.farm_location,
      farm_size_acres: Number(form.farm_size_acres),
      species_cultivated: form.species_cultivated || null,
      years_in_aquaculture: Number(form.years_in_aquaculture) || 0,
      annual_revenue: form.annual_revenue ? Number(form.annual_revenue) : null,
      loan_amount_requested: Number(form.loan_amount_requested),
      loan_purpose: form.loan_purpose,
      existing_loans_amount: Number(form.existing_loans_amount) || 0,
      collateral_details: [form.collateral_details, docUrls ? `KYC Docs: ${docUrls}` : ""].filter(Boolean).join("\n") || null,
      aadhaar_number: form.aadhaar_number || null,
      pan_number: form.pan_number || null,
      bank_account_number: form.bank_account_number || null,
      ifsc_code: form.ifsc_code || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error submitting application", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Loan application submitted successfully!" });
    setShowForm(false);
    setUploadedFiles([]);
    setForm({ full_name: "", phone: "", email: "", farm_location: "", farm_size_acres: "", species_cultivated: "", years_in_aquaculture: "", annual_revenue: "", loan_amount_requested: "", loan_purpose: "", existing_loans_amount: "0", collateral_details: "", aadhaar_number: "", pan_number: "", bank_account_number: "", ifsc_code: "" });
    fetchMyApplications();
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    if (s === "under_review") return "secondary";
    return "outline";
  };

  const getBankName = (bankId: string) => banks.find(b => b.id === bankId)?.bank_name || "Bank";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Apply for Bank Loans
          </CardTitle>
          <p className="text-sm text-muted-foreground">Get financing for your aquaculture investment from our partner banks</p>
        </CardHeader>
      </Card>

      {/* EMI Calculator */}
      <EMICalculator />

      {/* Partner Banks */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Available Banks</h3>
        {banks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No partner banks available at the moment.</p>}
        {banks.map(bank => (
          <Card key={bank.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-lg">{bank.bank_name}</h4>
                  {bank.interest_rate_min && (
                    <p className="text-sm text-muted-foreground">
                      Interest Rate: <span className="text-primary font-medium">{bank.interest_rate_min}% - {bank.interest_rate_max}%</span>
                    </p>
                  )}
                  {bank.max_loan_amount && (
                    <p className="text-sm text-muted-foreground">
                      Loan Range: ₹{Number(bank.min_loan_amount).toLocaleString()} - ₹{Number(bank.max_loan_amount).toLocaleString()}
                    </p>
                  )}
                  {bank.description && <p className="text-sm text-muted-foreground mt-1">{bank.description}</p>}
                  {bank.loan_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bank.loan_types.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  )}
                  {bank.requirements && (
                    <details className="mt-2">
                      <summary className="text-xs text-primary cursor-pointer">View Requirements</summary>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{bank.requirements}</p>
                    </details>
                  )}
                </div>
                <Button onClick={() => handleApply(bank)} className="ml-4">
                  Apply <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Applications */}
      {myApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> My Applications</h3>
          {myApps.map(app => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{getBankName(app.bank_id)} - ₹{Number(app.loan_amount_requested).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{app.loan_purpose}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.created_at).toLocaleDateString()}</p>
                  {app.admin_notes && <p className="text-xs mt-1 text-primary">Admin: {app.admin_notes}</p>}
                </div>
                <Badge variant={statusColor(app.status)}>{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for Loan - {selectedBank?.bank_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>

            <p className="text-sm font-medium text-muted-foreground pt-2">Farm Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Farm Location *</Label><Input placeholder="Village, District, State" value={form.farm_location} onChange={e => setForm(p => ({ ...p, farm_location: e.target.value }))} /></div>
              <div><Label>Farm Size (Acres) *</Label><Input type="number" value={form.farm_size_acres} onChange={e => setForm(p => ({ ...p, farm_size_acres: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Species Cultivated</Label><Input placeholder="Vannamei, Rohu, etc." value={form.species_cultivated} onChange={e => setForm(p => ({ ...p, species_cultivated: e.target.value }))} /></div>
              <div><Label>Years in Aquaculture</Label><Input type="number" value={form.years_in_aquaculture} onChange={e => setForm(p => ({ ...p, years_in_aquaculture: e.target.value }))} /></div>
            </div>
            <div><Label>Annual Revenue (₹)</Label><Input type="number" value={form.annual_revenue} onChange={e => setForm(p => ({ ...p, annual_revenue: e.target.value }))} /></div>

            <p className="text-sm font-medium text-muted-foreground pt-2">Loan Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Loan Amount (₹) *</Label><Input type="number" value={form.loan_amount_requested} onChange={e => setForm(p => ({ ...p, loan_amount_requested: e.target.value }))} /></div>
              <div><Label>Existing Loans (₹)</Label><Input type="number" value={form.existing_loans_amount} onChange={e => setForm(p => ({ ...p, existing_loans_amount: e.target.value }))} /></div>
            </div>
            <div><Label>Loan Purpose *</Label><Textarea placeholder="Describe what you need the loan for..." value={form.loan_purpose} onChange={e => setForm(p => ({ ...p, loan_purpose: e.target.value }))} /></div>
            <div><Label>Collateral Details</Label><Textarea placeholder="Land, equipment, or other assets..." value={form.collateral_details} onChange={e => setForm(p => ({ ...p, collateral_details: e.target.value }))} /></div>

            <p className="text-sm font-medium text-muted-foreground pt-2">KYC & Bank Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Aadhaar Number</Label><Input value={form.aadhaar_number} onChange={e => setForm(p => ({ ...p, aadhaar_number: e.target.value }))} /></div>
              <div><Label>PAN Number</Label><Input value={form.pan_number} onChange={e => setForm(p => ({ ...p, pan_number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bank Account Number</Label><Input value={form.bank_account_number} onChange={e => setForm(p => ({ ...p, bank_account_number: e.target.value }))} /></div>
              <div><Label>IFSC Code</Label><Input value={form.ifsc_code} onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value }))} /></div>
            </div>

            {/* Document Upload */}
            <p className="text-sm font-medium text-muted-foreground pt-2">Upload KYC Documents</p>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground mb-2">Upload Aadhaar, PAN, Land Documents (Max 5MB each)</p>
              <label className="cursor-pointer">
                <Input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading...</> : "Choose Files"}</span>
                </Button>
              </label>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm">
                    <span className="truncate flex-1">{f.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankLoanSection;
