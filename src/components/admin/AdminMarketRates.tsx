import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { FileUp, IndianRupee, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

type RateKind = "shrimp" | "fish";

interface ShrimpRate {
  id: string;
  location: string;
  count_range: string;
  date: string;
  rate_per_kg: number;
}

interface FishRate {
  id: string;
  species: string;
  location: string;
  state: string;
  date: string;
  rate_per_kg: number;
}

type SuggestedShrimpRate = Omit<ShrimpRate, "id"> & { id: string; selected: boolean };
type SuggestedFishRate = Omit<FishRate, "id"> & { id: string; selected: boolean };

const today = () => new Date().toISOString().split("T")[0];

const AdminMarketRates = () => {
  const [shrimpRates, setShrimpRates] = useState<ShrimpRate[]>([]);
  const [fishRates, setFishRates] = useState<FishRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKind, setEditingKind] = useState<RateKind>("shrimp");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [savingImportedKind, setSavingImportedKind] = useState<RateKind | null>(null);
  const [pdfInput, setPdfInput] = useState<HTMLInputElement | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [suggestedRates, setSuggestedRates] = useState<{ shrimp: SuggestedShrimpRate[]; fish: SuggestedFishRate[] } | null>(null);
  const [form, setForm] = useState({
    location: "",
    state: "",
    species: "",
    countRange: "",
    date: today(),
    rate: "",
  });
  const { toast } = useToast();

  const handlePdfUpload = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Choose a PDF", description: "Market price import accepts PDF files only.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "PDF is too large", description: "Choose a file smaller than 20 MB.", variant: "destructive" });
      return;
    }

    setPdfBusy(true);
    setPdfName(file.name);
    setSuggestedRates(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      if (document.numPages > 100) throw new Error("The PDF has more than 100 pages. Choose a shorter market sheet.");
      const pageTexts: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pageTexts.push(content.items.map((item) => "str" in item ? item.str : "").filter(Boolean).join(" "));
      }
      const documentText = pageTexts.join("\n").trim();
      if (documentText.length < 20) throw new Error("No readable text was found. Scanned-image PDFs need OCR; try a searchable PDF.");
      if (documentText.length > 160000) throw new Error("The extracted text exceeds 160,000 characters. Choose a shorter market sheet.");

      const { data, error } = await supabase.functions.invoke("extract-market-rates", { body: { documentText } });
      if (error) throw new Error(data?.error ?? error.message ?? "Could not analyze this PDF.");
      const importedShrimp = Array.isArray(data?.shrimp) ? data.shrimp : [];
      const importedFish = Array.isArray(data?.fish) ? data.fish : [];
      if (!importedShrimp.length && !importedFish.length) throw new Error("No explicit shrimp or fish prices were found in this PDF.");
      setSuggestedRates({
        shrimp: importedShrimp.map((rate: Omit<ShrimpRate, "id">, index: number) => ({ ...rate, id: `shrimp-${index}`, selected: true })),
        fish: importedFish.map((rate: Omit<FishRate, "id">, index: number) => ({ ...rate, id: `fish-${index}`, selected: true })),
      });
      toast({ title: "PDF analyzed", description: "Review each suggested rate and fill any missing publication date before publishing." });
    } catch (error) {
      toast({ title: "Could not analyze PDF", description: error instanceof Error ? error.message : "Please try another PDF.", variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const publishImportedRates = async (kind: RateKind) => {
    if (!suggestedRates) return;
    const selected = suggestedRates[kind].filter((rate) => rate.selected);
    if (selected.length === 0) {
      toast({ title: "Select rates to publish", description: `Choose at least one ${kind} rate to publish.`, variant: "destructive" });
      return;
    }
    if (selected.some((rate) => !rate.date || !/^\d{4}-\d{2}-\d{2}$/.test(rate.date))) {
      toast({ title: "Publication date required", description: "Enter a valid date for every selected rate. The PDF did not state a date for some prices.", variant: "destructive" });
      return;
    }
    setSavingImportedKind(kind);
    const rows = selected.map(({ id: _id, selected: _selected, ...rate }) => rate);
    const result = kind === "shrimp"
      ? await supabase.from("shrimp_rates").insert(rows)
      : await supabase.from("fish_rates").insert(rows);
    if (result.error) {
      toast({ title: "Could not publish imported prices", description: result.error.message, variant: "destructive" });
    } else {
      setSuggestedRates((previous) => previous ? { ...previous, [kind]: [] } : previous);
      toast({ title: `${selected.length} ${kind} rate(s) published`, description: "Prices now appear with other admin-published market rates." });
      await fetchRates();
    }
    setSavingImportedKind(null);
  };

  const fetchRates = async () => {
    setLoading(true);
    const [shrimpResult, fishResult] = await Promise.all([
      supabase.from("shrimp_rates").select("id, location, count_range, date, rate_per_kg").order("date", { ascending: false }).order("location").limit(300),
      supabase.from("fish_rates").select("id, species, location, state, date, rate_per_kg").order("date", { ascending: false }).order("location").limit(300),
    ]);

    if (shrimpResult.error || fishResult.error) {
      toast({ title: "Could not load rates", description: shrimpResult.error?.message || fishResult.error?.message, variant: "destructive" });
    } else {
      setShrimpRates(shrimpResult.data || []);
      setFishRates(fishResult.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openNew = (kind: RateKind) => {
    setEditingKind(kind);
    setEditingId(null);
    setForm({ location: "", state: "", species: "", countRange: kind === "shrimp" ? "20" : "", date: today(), rate: "" });
    setDialogOpen(true);
  };

  const openEdit = (kind: RateKind, rate: ShrimpRate | FishRate) => {
    setEditingKind(kind);
    setEditingId(rate.id);
    if (kind === "shrimp") {
      const shrimp = rate as ShrimpRate;
      setForm({ location: shrimp.location, state: "", species: "", countRange: shrimp.count_range, date: shrimp.date, rate: String(shrimp.rate_per_kg) });
    } else {
      const fish = rate as FishRate;
      setForm({ location: fish.location, state: fish.state, species: fish.species, countRange: "", date: fish.date, rate: String(fish.rate_per_kg) });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const rate = Number(form.rate);
    if (!form.location.trim() || !form.date || !Number.isFinite(rate) || rate <= 0) {
      toast({ title: "Check the price details", description: "Market, date, and a price greater than zero are required.", variant: "destructive" });
      return;
    }
    if (editingKind === "shrimp" && !form.countRange.trim()) {
      toast({ title: "Count range required", description: "Enter the shrimp count range, such as 20 or 60.", variant: "destructive" });
      return;
    }
    if (editingKind === "fish" && (!form.species.trim() || !form.state.trim())) {
      toast({ title: "Fish details required", description: "Species and state are required for fish prices.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = editingKind === "shrimp"
      ? editingId
        ? await supabase.from("shrimp_rates").update({ location: form.location.trim(), count_range: form.countRange.trim(), date: form.date, rate_per_kg: rate }).eq("id", editingId)
        : await supabase.from("shrimp_rates").insert({ location: form.location.trim(), count_range: form.countRange.trim(), date: form.date, rate_per_kg: rate })
      : editingId
        ? await supabase.from("fish_rates").update({ species: form.species.trim(), location: form.location.trim(), state: form.state.trim(), date: form.date, rate_per_kg: rate }).eq("id", editingId)
        : await supabase.from("fish_rates").insert({ species: form.species.trim(), location: form.location.trim(), state: form.state.trim(), date: form.date, rate_per_kg: rate });

    if (result.error) {
      toast({ title: "Could not save price", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Price updated" : "Price published", description: "Users will see this value in the market rates section." });
      setDialogOpen(false);
      await fetchRates();
    }
    setSaving(false);
  };

  const handleDelete = async (kind: RateKind, id: string) => {
    if (!window.confirm("Remove this published market price?")) return;
    const result = kind === "shrimp"
      ? await supabase.from("shrimp_rates").delete().eq("id", id)
      : await supabase.from("fish_rates").delete().eq("id", id);
    if (result.error) {
      toast({ title: "Could not remove price", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Price removed" });
      await fetchRates();
    }
  };

  const editDialog = (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editingId ? "Edit" : "Publish"} {editingKind === "shrimp" ? "Shrimp" : "Fish"} Price</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rate-location">Market</Label>
          <Input id="rate-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Bhimavaram" />
        </div>
        {editingKind === "shrimp" ? (
          <div className="grid gap-2">
            <Label htmlFor="rate-count">Shrimp count range</Label>
            <Input id="rate-count" value={form.countRange} onChange={(event) => setForm({ ...form, countRange: event.target.value })} placeholder="e.g. 20" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="rate-species">Fish species</Label>
              <Input id="rate-species" value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })} placeholder="e.g. Rohu" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-state">State</Label>
              <Input id="rate-state" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="e.g. Andhra Pradesh" />
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="rate-date">Price date</Label>
            <Input id="rate-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate-value">Price per kg (₹)</Label>
            <Input id="rate-value" type="number" min="1" step="0.01" value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} placeholder="0" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
          {editingId ? "Save Price" : "Publish Price"}
        </Button>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Market Price Management</h2>
          <p className="text-sm text-muted-foreground">Publish verified daily prices that appear for every user.</p>
        </div>
        <Button variant="outline" onClick={fetchRates} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import prices from a PDF</CardTitle>
          <p className="text-sm text-muted-foreground">Extracted prices stay unpublished until you review and publish them. Only explicit prices are included.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={setPdfInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => { void handlePdfUpload(event.target.files?.[0]); event.target.value = ""; }}
          />
          <Button type="button" variant="outline" onClick={() => pdfInput?.click()} disabled={pdfBusy || savingImportedKind !== null}>
            {pdfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {pdfBusy ? "Analyzing PDF…" : "Choose and analyze PDF"}
          </Button>
          {pdfName && <p className="text-sm text-muted-foreground">{pdfName}</p>}
          {suggestedRates && (
            <div className="space-y-5 border-t pt-4">
              <p className="text-sm font-medium">Review the extracted values. Unprinted dates are left blank and must be entered before publishing.</p>
              {suggestedRates.shrimp.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-semibold">Shrimp prices</h3>
                  {suggestedRates.shrimp.map((rate) => (
                    <div key={rate.id} className="grid gap-3 border-b pb-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(150px,200px)] sm:items-center">
                      <Checkbox aria-label={`Select shrimp rate ${rate.location} count ${rate.count_range}`} checked={rate.selected} onCheckedChange={(checked) => setSuggestedRates((old) => old ? { ...old, shrimp: old.shrimp.map((item) => item.id === rate.id ? { ...item, selected: checked === true } : item) } : old)} />
                      <div className="text-sm"><p className="font-medium">{rate.location} · Count {rate.count_range} · ₹{rate.rate_per_kg}/kg</p><p className="text-xs text-muted-foreground">Date {rate.date || "not printed in PDF"}</p></div>
                      <Input aria-label={`Date for shrimp rate ${rate.location} count ${rate.count_range}`} type="date" value={rate.date || ""} onChange={(event) => setSuggestedRates((old) => old ? { ...old, shrimp: old.shrimp.map((item) => item.id === rate.id ? { ...item, date: event.target.value } : item) } : old)} />
                    </div>
                  ))}
                  <Button onClick={() => void publishImportedRates("shrimp")} disabled={pdfBusy || savingImportedKind !== null}>
                    {savingImportedKind === "shrimp" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish selected shrimp prices
                  </Button>
                </section>
              )}
              {suggestedRates.fish.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-semibold">Fish prices</h3>
                  {suggestedRates.fish.map((rate) => (
                    <div key={rate.id} className="grid gap-3 border-b pb-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(150px,200px)] sm:items-center">
                      <Checkbox aria-label={`Select fish rate ${rate.species} ${rate.location}`} checked={rate.selected} onCheckedChange={(checked) => setSuggestedRates((old) => old ? { ...old, fish: old.fish.map((item) => item.id === rate.id ? { ...item, selected: checked === true } : item) } : old)} />
                      <div className="text-sm"><p className="font-medium">{rate.species} · {rate.location}, {rate.state} · ₹{rate.rate_per_kg}/kg</p><p className="text-xs text-muted-foreground">Date {rate.date || "not printed in PDF"}</p></div>
                      <Input aria-label={`Date for fish rate ${rate.species} ${rate.location}`} type="date" value={rate.date || ""} onChange={(event) => setSuggestedRates((old) => old ? { ...old, fish: old.fish.map((item) => item.id === rate.id ? { ...item, date: event.target.value } : item) } : old)} />
                    </div>
                  ))}
                  <Button onClick={() => void publishImportedRates("fish")} disabled={pdfBusy || savingImportedKind !== null}>
                    {savingImportedKind === "fish" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish selected fish prices
                  </Button>
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Shrimp prices</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Per-count prices by market.</p>
            </div>
            <Dialog open={dialogOpen && editingKind === "shrimp"} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" onClick={() => openNew("shrimp")}><Plus className="mr-1 h-4 w-4" />Add</Button></DialogTrigger>
              {editDialog}
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : shrimpRates.length === 0 ? <p className="text-sm text-muted-foreground">No published shrimp prices yet.</p> : (
              <div className="space-y-2">
                {shrimpRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                    <div className="min-w-0"><p className="truncate font-medium">{rate.location} · Count {rate.count_range}</p><p className="text-xs text-muted-foreground">{rate.date}</p></div>
                    <div className="flex items-center gap-2"><Badge variant="secondary">₹{rate.rate_per_kg}/kg</Badge><Button variant="ghost" size="icon" onClick={() => openEdit("shrimp", rate)} aria-label="Edit shrimp price"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete("shrimp", rate.id)} aria-label="Delete shrimp price"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Fish prices</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Species prices by market.</p>
            </div>
            <Dialog open={dialogOpen && editingKind === "fish"} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" onClick={() => openNew("fish")}><Plus className="mr-1 h-4 w-4" />Add</Button></DialogTrigger>
              {editDialog}
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : fishRates.length === 0 ? <p className="text-sm text-muted-foreground">No published fish prices yet.</p> : (
              <div className="space-y-2">
                {fishRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                    <div className="min-w-0"><p className="truncate font-medium">{rate.species} · {rate.location}</p><p className="text-xs text-muted-foreground">{rate.state} · {rate.date}</p></div>
                    <div className="flex items-center gap-2"><Badge variant="secondary">₹{rate.rate_per_kg}/kg</Badge><Button variant="ghost" size="icon" onClick={() => openEdit("fish", rate)} aria-label="Edit fish price"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete("fish", rate.id)} aria-label="Delete fish price"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMarketRates;