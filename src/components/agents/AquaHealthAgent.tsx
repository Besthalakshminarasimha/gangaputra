import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  AlertTriangle,
  Camera,
  Loader2,
  MapPin,
  Pill,
  Stethoscope,
  Store,
  Phone,
} from "lucide-react";

interface Diagnosis {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: "low" | "medium" | "high";
}

interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  dosage: string | null;
  uses: string | null;
  price: number | null;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  location: string;
  phone: string | null;
  consultation_fee: number | null;
  image_url: string | null;
  distance?: number;
}

interface Store {
  id: string;
  name: string;
  type: string;
  location: string;
  region: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  distance?: number;
}

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const severityColor = (s: string) =>
  s === "high"
    ? "bg-red-500/15 text-red-600 border-red-500/30"
    : s === "medium"
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : "bg-green-500/15 text-green-600 border-green-500/30";

const AquaHealthAgent = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImagePreview(url);
      setImageBase64(url);
    };
    reader.readAsDataURL(f);
  };

  const getLocation = (): Promise<{ lat: number; lon: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 },
      );
    });

  const runAgent = async () => {
    if (!symptoms.trim() && !imageBase64) {
      toast({ title: "Add symptoms or image", variant: "destructive" });
      return;
    }
    setLoading(true);
    setDiagnoses([]);
    setMedicines([]);
    setDoctors([]);
    setStores([]);

    try {
      // 1. Diagnose
      const { data, error } = await supabase.functions.invoke("ai-disease-predict", {
        body: { symptoms, imageBase64, language: "english" },
      });
      if (error) throw error;
      const dxs: Diagnosis[] = data?.diagnoses ?? [];
      setDiagnoses(dxs);

      const topDisease = dxs[0]?.disease ?? "";

      // 2. Medicines (search by name/uses/category against the top diagnosis keywords)
      const keywords = topDisease
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3)
        .slice(0, 3);

      let medQuery = supabase
        .from("medicines")
        .select("id, name, category, manufacturer, dosage, uses, price")
        .eq("is_active", true)
        .limit(8);

      if (keywords.length > 0) {
        const orFilter = keywords
          .flatMap((k) => [`uses.ilike.%${k}%`, `name.ilike.%${k}%`, `category.ilike.%${k}%`])
          .join(",");
        medQuery = medQuery.or(orFilter);
      }
      const { data: meds } = await medQuery;
      setMedicines((meds as Medicine[]) ?? []);

      // 3. Geolocate
      const loc = await getLocation();
      setCoords(loc);

      // 4. Doctors (sorted by distance if we have location, else first 5)
      const { data: docs } = await supabase
        .from("doctors")
        .select("id, name, specialization, location, phone, consultation_fee, image_url")
        .eq("is_active", true);
      const docList: Doctor[] = (docs as Doctor[]) ?? [];
      setDoctors(docList.slice(0, 5));

      // 5. Aqua stores from hatcheries (type ilike store/medicine/supplier)
      const { data: hat } = await supabase
        .from("hatcheries")
        .select("id, name, type, location, region, phone, latitude, longitude")
        .eq("is_active", true);
      let storeList: Store[] = (hat as Store[]) ?? [];
      if (loc) {
        storeList = storeList
          .map((s) => ({
            ...s,
            distance:
              s.latitude && s.longitude
                ? haversine(loc.lat, loc.lon, s.latitude, s.longitude)
                : Infinity,
          }))
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      }
      setStores(storeList.slice(0, 5));

      toast({ title: "Health report ready", description: `${dxs.length} possible diagnoses` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Agent failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-rose-500/20">
      <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-rose-600" />
          Aqua Health Agent
          <Badge variant="secondary" className="ml-auto">All-in-one</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Diagnose disease → cause, severity, treatment → suggest medicines → find nearest doctor & aqua store.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Textarea
          placeholder="Describe symptoms (e.g. white spots on shrimp, lethargy, white feces)..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
        />

        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
            <Camera className="h-4 w-4" />
            <span className="text-sm">Add photo (optional)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="h-12 w-12 rounded object-cover" />
          )}
        </div>

        <Button onClick={runAgent} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running agent...</>
          ) : (
            <><Activity className="h-4 w-4 mr-2" /> Run Aqua Health Agent</>
          )}
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
              </h3>
              <div className="grid gap-2">
                {medicines.map((m) => (
                  <div key={m.id} className="border rounded-lg p-3 flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.manufacturer} · {m.category}</p>
                      {m.dosage && <p className="text-xs mt-1">Dosage: {m.dosage}</p>}
                    </div>
                    {m.price && <Badge variant="secondary">₹{m.price}</Badge>}
                  </div>
                ))}
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
                  <div key={d.id} className="border rounded-lg p-3 flex items-center gap-3">
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-teal-500/15 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-teal-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.specialization} · {d.location}
                      </p>
                    </div>
                    {d.phone && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${d.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                      </Button>
                    )}
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
                <Store className="h-4 w-4 text-blue-500" />
                Nearby Aqua Stores
                {coords && <Badge variant="outline" className="ml-1 text-xs"><MapPin className="h-3 w-3 mr-1" />Located</Badge>}
              </h3>
              {!coords && (
                <p className="text-xs text-muted-foreground">
                  Enable location to sort by distance. Showing all active stores.
                </p>
              )}
              <div className="grid gap-2">
                {stores.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-blue-500/15 flex items-center justify-center">
                      <Store className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.type} · {s.location}, {s.region}
                      </p>
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
      </CardContent>
    </Card>
  );
};

export default AquaHealthAgent;
