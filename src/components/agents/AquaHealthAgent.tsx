import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import {
  Activity, AlertTriangle, Camera, Loader2, MapPin, Pill, Stethoscope,
  Store as StoreIcon, Phone, MessageCircle, CalendarPlus, Save, Share2,
  ShieldAlert, History, Trash2, Navigation,
} from "lucide-react";

// --- Types ---
interface Diagnosis {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: "low" | "medium" | "high";
}
interface Medicine {
  id: string; name: string; category: string; manufacturer: string;
  dosage: string | null; uses: string | null; price: number | null;
  active_ingredient?: string | null;
}
interface Doctor {
  id: string; name: string; specialization: string; location: string;
  phone: string | null; consultation_fee: number | null; image_url: string | null;
}
interface StoreRow {
  id: string; name: string; type: string; location: string; region: string;
  phone: string | null; latitude: number | null; longitude: number | null;
  distance?: number;
}
interface SavedReport {
  id: string; created_at: string; symptoms: string | null;
  diagnoses: Diagnosis[]; share_token: string;
}

// --- Disease → recommended active ingredients / keywords ---
const DISEASE_INGREDIENT_MAP: Record<string, string[]> = {
  "white spot": ["iodine", "potassium permanganate", "vitamin c", "immunostimulant", "beta glucan"],
  "wssv": ["iodine", "vitamin c", "beta glucan", "immunostimulant"],
  "ehp": ["probiotic", "bacillus", "garlic", "organic acid"],
  "vibrio": ["oxytetracycline", "florfenicol", "probiotic", "bacillus", "organic acid"],
  "vibriosis": ["oxytetracycline", "florfenicol", "probiotic"],
  "ahpnd": ["bacillus", "probiotic", "organic acid", "oxytetracycline"],
  "ems": ["probiotic", "organic acid", "bacillus"],
  "white feces": ["probiotic", "bacillus", "organic acid", "yeast"],
  "wfd": ["probiotic", "yeast", "organic acid"],
  "running mortality": ["probiotic", "vitamin c", "immunostimulant"],
  "rms": ["probiotic", "vitamin c"],
  "loose shell": ["calcium", "mineral", "magnesium", "phosphorus"],
  "soft shell": ["calcium", "mineral", "dolomite"],
  "black gill": ["potassium permanganate", "formalin", "zeolite"],
  "gill rot": ["formalin", "potassium permanganate"],
  "fungal": ["formalin", "malachite green", "potassium permanganate"],
  "saprolegnia": ["formalin", "salt"],
  "tail rot": ["oxytetracycline", "iodine"],
  "fin rot": ["oxytetracycline", "iodine", "florfenicol"],
  "argulus": ["emamectin", "deltamethrin"],
  "parasite": ["formalin", "praziquantel", "emamectin"],
  "ich": ["formalin", "salt", "malachite green"],
};

// --- Generic safety bullets per category ---
const SAFETY_RULES: Record<string, string[]> = {
  antibiotic: [
    "Use ONLY when bacterial infection is confirmed — not as a preventive.",
    "Complete the full prescribed course; never under-dose.",
    "Withdrawal period: STOP at least 21 days before harvest.",
    "Stop and call a doctor if mortality keeps rising after 48h.",
  ],
  probiotic: [
    "Apply during morning hours; avoid mixing with disinfectants the same day.",
    "Store cool & dry; use within 6 months of opening.",
    "No withdrawal period required.",
  ],
  disinfectant: [
    "Wear gloves, mask, and goggles while handling.",
    "Never overdose — can crash DO and stress shrimp.",
    "Withdrawal period: minimum 7 days before harvest.",
    "Stop immediately if you see surfacing or gasping.",
  ],
  mineral: [
    "Apply in evening; avoid overdosing in soft water (cramping).",
    "Safe to use throughout the cycle.",
  ],
  immunostimulant: [
    "Use as feed additive at the recommended inclusion rate.",
    "Combine with vitamin C for best effect.",
    "Generally safe; no withdrawal required.",
  ],
  default: [
    "Follow label dosage exactly — overdose can be fatal.",
    "Observe pond for 2h after application; stop if shrimp show distress.",
    "Maintain a 7-day withdrawal period before harvest unless label states otherwise.",
    "Seek a doctor if symptoms persist beyond 72h.",
  ],
};

const safetyFor = (category: string): string[] => {
  const k = category.toLowerCase();
  if (k.includes("antibiotic") || k.includes("antimicrobial")) return SAFETY_RULES.antibiotic;
  if (k.includes("probiotic")) return SAFETY_RULES.probiotic;
  if (k.includes("disinfect") || k.includes("sanit")) return SAFETY_RULES.disinfectant;
  if (k.includes("mineral") || k.includes("calcium")) return SAFETY_RULES.mineral;
  if (k.includes("immuno") || k.includes("vitamin")) return SAFETY_RULES.immunostimulant;
  return SAFETY_RULES.default;
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const severityColor = (s: string) =>
  s === "high" ? "bg-red-500/15 text-red-600 border-red-500/30"
  : s === "medium" ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
  : "bg-green-500/15 text-green-600 border-green-500/30";

// Normalize a phone for WhatsApp: strip non-digits, prepend 91 if Indian 10-digit
const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const AquaHealthAgent = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [appointmentDoctor, setAppointmentDoctor] = useState<Doctor | null>(null);
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("");
  const [aptReason, setAptReason] = useState("");

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("health_reports")
      .select("id, created_at, symptoms, diagnoses, share_token")
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data as any) ?? []);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" }); return;
    }
    const reader = new FileReader();
    reader.onload = () => { const url = reader.result as string; setImagePreview(url); setImageBase64(url); };
    reader.readAsDataURL(f);
  };

  const getLocation = (): Promise<{ lat: number; lon: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null), { timeout: 8000 },
      );
    });

  // Build keyword set from disease names + recommended ingredients
  const buildMedicineKeywords = (dxs: Diagnosis[], symptomsText: string): string[] => {
    const keys = new Set<string>();
    const allText = (dxs.map(d => d.disease).join(" ") + " " + symptomsText).toLowerCase();
    // Direct ingredient hints
    for (const [disease, ingredients] of Object.entries(DISEASE_INGREDIENT_MAP)) {
      if (allText.includes(disease)) ingredients.forEach(i => keys.add(i));
    }
    // Disease tokens
    dxs.forEach(d => {
      d.disease.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).forEach(w => keys.add(w));
    });
    return Array.from(keys).slice(0, 10);
  };

  const runAgent = async () => {
    if (!symptoms.trim() && !imageBase64) {
      toast({ title: "Add symptoms or image", variant: "destructive" }); return;
    }
    setLoading(true);
    setDiagnoses([]); setMedicines([]); setDoctors([]); setStores([]);
    setSavedReportId(null); setSavedToken(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-disease-predict", {
        body: { symptoms, imageBase64, language: "english" },
      });
      if (error) throw error;
      const dxs: Diagnosis[] = data?.diagnoses ?? [];
      setDiagnoses(dxs);

      // Smart medicine matching by ingredient + disease keywords
      const keywords = buildMedicineKeywords(dxs, symptoms);
      const { data: allMeds } = await supabase
        .from("medicines")
        .select("id, name, category, manufacturer, dosage, uses, price, active_ingredient")
        .eq("is_active", true);

      const medList = (allMeds as Medicine[]) ?? [];
      const scored = medList.map((m) => {
        const hay = `${m.name} ${m.category} ${m.uses ?? ""} ${m.active_ingredient ?? ""}`.toLowerCase();
        let score = 0;
        keywords.forEach((k) => { if (hay.includes(k)) score += k.length > 5 ? 3 : 1; });
        return { m, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.m);
      setMedicines(scored);

      const loc = await getLocation();
      setCoords(loc);

      const { data: docs } = await supabase
        .from("doctors")
        .select("id, name, specialization, location, phone, consultation_fee, image_url")
        .eq("is_active", true);
      setDoctors(((docs as Doctor[]) ?? []).slice(0, 5));

      const { data: hat } = await supabase
        .from("hatcheries")
        .select("id, name, type, location, region, phone, latitude, longitude")
        .eq("is_active", true);
      let storeList: StoreRow[] = (hat as StoreRow[]) ?? [];
      if (loc) {
        storeList = storeList.map(s => ({
          ...s,
          distance: s.latitude && s.longitude ? haversine(loc.lat, loc.lon, s.latitude, s.longitude) : Infinity,
        })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      }
      setStores(storeList.slice(0, 5));

      toast({ title: "Health report ready", description: `${dxs.length} possible diagnoses` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Agent failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const saveReport = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) {
      toast({ title: "Sign in to save", variant: "destructive" }); return;
    }
    const { data, error } = await supabase
      .from("health_reports")
      .insert({
        user_id: u.user.id,
        symptoms,
        image_url: imagePreview,
        diagnoses: diagnoses as any,
        medicines: medicines as any,
        doctors: doctors as any,
        stores: stores as any,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
      })
      .select("id, share_token")
      .single();
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" }); return;
    }
    setSavedReportId(data.id); setSavedToken(data.share_token);
    loadHistory();
    toast({ title: "Saved to your account" });
  };

  const deleteReport = async (id: string) => {
    await supabase.from("health_reports").delete().eq("id", id);
    loadHistory();
  };

  const shareUrl = savedToken
    ? `${window.location.origin}/health-report/${savedToken}`
    : "";

  const requestAppointment = async () => {
    if (!appointmentDoctor || !aptDate || !aptTime) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_appointments").insert({
      user_id: u.user.id, doctor_id: appointmentDoctor.id,
      appointment_date: aptDate, appointment_time: aptTime,
      reason: aptReason || `Aqua Health Agent: ${diagnoses[0]?.disease ?? "consultation"}`,
    });
    if (error) toast({ title: "Request failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Appointment requested" });
      setAppointmentDoctor(null); setAptDate(""); setAptTime(""); setAptReason("");
    }
  };

  const mapCenter: [number, number] = coords
    ? [coords.lat, coords.lon]
    : stores.find(s => s.latitude && s.longitude)
      ? [stores[0].latitude!, stores[0].longitude!]
      : [16.5449, 81.5212]; // Bhimavaram default

  return (
    <Card className="border-2 border-rose-500/20">
      <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Activity className="h-5 w-5 text-rose-600" />
          Aqua Health Agent
          <Badge variant="secondary" className="ml-auto">All-in-one</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Diagnose disease → cause, severity, treatment → smart medicine match → map of nearest doctors & stores → save & share.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Tabs defaultValue="run">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="run"><Activity className="h-4 w-4 mr-1" /> Run</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-4 pt-4">
            <Textarea
              placeholder="Describe symptoms (e.g. white spots on shrimp, lethargy, white feces)..."
              value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3}
            />
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                <Camera className="h-4 w-4" />
                <span className="text-sm">Add photo (optional)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              {imagePreview && <img src={imagePreview} alt="preview" className="h-12 w-12 rounded object-cover" />}
            </div>
            <Button onClick={runAgent} disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running agent...</>
                : <><Activity className="h-4 w-4 mr-2" /> Run Aqua Health Agent</>}
            </Button>

            {diagnoses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Diagnoses
                  </h3>
                  {diagnoses.map((d, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{d.disease}</p>
                          <p className="text-xs text-muted-foreground">Confidence: {d.confidence}%</p>
                        </div>
                        <Badge variant="outline" className={severityColor(d.severity)}>
                          {d.severity.toUpperCase()} severity
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p><span className="font-medium">Treatment:</span> {d.treatment}</p>
                        <p className="mt-1"><span className="font-medium">Prevention:</span> {d.prevention}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {medicines.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Pill className="h-4 w-4 text-purple-500" /> Suggested Medicines
                    <Badge variant="outline" className="text-xs">matched by ingredient + disease</Badge>
                  </h3>
                  <div className="grid gap-2">
                    {medicines.map((m) => {
                      const safety = safetyFor(m.category);
                      return (
                        <div key={m.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{m.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.manufacturer} · {m.category}
                                {m.active_ingredient && ` · ${m.active_ingredient}`}
                              </p>
                              {m.dosage && <p className="text-xs mt-1"><b>Dosage:</b> {m.dosage}</p>}
                            </div>
                            {m.price && <Badge variant="secondary">₹{m.price}</Badge>}
                          </div>
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                              <ShieldAlert className="h-3 w-3" /> Safety & usage
                            </p>
                            <ul className="text-xs space-y-0.5 list-disc list-inside text-muted-foreground">
                              {safety.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {(doctors.length > 0 || stores.length > 0) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" /> Map: Nearest Doctors & Aqua Stores
                  </h3>
                  <div className="h-72 rounded-lg overflow-hidden border">
                    <MapContainer center={mapCenter} zoom={coords ? 11 : 8} style={{ height: "100%", width: "100%" }}>
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {coords && (
                        <Marker position={[coords.lat, coords.lon]}>
                          <Popup>Your location</Popup>
                        </Marker>
                      )}
                      {stores.filter(s => s.latitude && s.longitude).map(s => (
                        <Marker key={s.id} position={[s.latitude!, s.longitude!]}>
                          <Popup>
                            <strong>{s.name}</strong><br />
                            {s.type} · {s.location}<br />
                            {s.distance && s.distance !== Infinity && `${s.distance.toFixed(1)} km away`}
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </div>
              </>
            )}

            {doctors.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-500" /> Nearest Doctors
                  </h3>
                  <div className="grid gap-2">
                    {doctors.map((d) => (
                      <div key={d.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          {d.image_url ? (
                            <img src={d.image_url} alt={d.name} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-teal-500/15 flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-teal-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{d.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{d.specialization} · {d.location}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {d.phone && <>
                            <Button asChild size="sm" variant="outline">
                              <a href={`tel:${d.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="text-green-600">
                              <a target="_blank" rel="noopener noreferrer"
                                href={`https://wa.me/${waNumber(d.phone)}?text=${encodeURIComponent(`Hello Dr. ${d.name}, I need consultation regarding ${diagnoses[0]?.disease ?? "pond health issue"}.`)}`}>
                                <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                              </a>
                            </Button>
                          </>}
                          <Button size="sm" variant="default" onClick={() => setAppointmentDoctor(d)}>
                            <CalendarPlus className="h-3 w-3 mr-1" /> Request Appointment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {stores.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-blue-500" />
                    Nearby Aqua Stores
                    {coords && <Badge variant="outline" className="ml-1 text-xs"><MapPin className="h-3 w-3 mr-1" />Located</Badge>}
                  </h3>
                  <div className="grid gap-2">
                    {stores.map((s) => (
                      <div key={s.id} className="border rounded-lg p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-blue-500/15 flex items-center justify-center">
                          <StoreIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.type} · {s.location}, {s.region}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {s.distance !== undefined && s.distance !== Infinity && (
                            <Badge variant="secondary" className="text-xs">{s.distance.toFixed(1)} km</Badge>
                          )}
                          {s.phone && (
                            <Button asChild size="sm" variant="outline">
                              <a href={`tel:${s.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {diagnoses.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {!savedReportId ? (
                    <Button onClick={saveReport} variant="default">
                      <Save className="h-4 w-4 mr-1" /> Save report to my account
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="px-3 py-2">✓ Saved</Badge>
                  )}
                  {savedToken && (
                    <Button onClick={() => setShareOpen(true)} variant="outline">
                      <Share2 className="h-4 w-4 mr-1" /> Share / QR for traceability
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2 pt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved reports yet.</p>
            ) : history.map((r) => (
              <div key={r.id} className="border rounded-lg p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  <p className="text-sm font-medium truncate">
                    {(r.diagnoses as any)?.[0]?.disease ?? r.symptoms ?? "Report"}
                  </p>
                  <a href={`/health-report/${r.share_token}`} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-blue-500 hover:underline">View shared link</a>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteReport(r.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Share / QR Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share health report</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan for farm traceability & follow-up visits
            </p>
            <input readOnly value={shareUrl} className="w-full text-xs p-2 border rounded bg-muted" />
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(shareUrl); toast({ title: "Link copied" }); }}>
              Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <Dialog open={!!appointmentDoctor} onOpenChange={(o) => !o && setAppointmentDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request appointment with {appointmentDoctor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Date</label>
              <input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)}
                className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea value={aptReason} onChange={(e) => setAptReason(e.target.value)}
                placeholder={`Re: ${diagnoses[0]?.disease ?? "consultation"}`} rows={2} />
            </div>
            <Button onClick={requestAppointment} className="w-full" disabled={!aptDate || !aptTime}>
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AquaHealthAgent;
