import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Pill, Loader2 } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  dosage: string | null;
  uses: string | null;
  price: number | null;
  image_url: string | null;
}

interface Props {
  diseases: string[];
}

const MedicineSuggestions = ({ diseases }: Props) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (diseases.length === 0) { setLoading(false); return; }

    const fetchMedicines = async () => {
      setLoading(true);
      // Search medicines whose uses or category match any of the disease keywords
      const keywords = diseases.flatMap(d => d.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 3));
      
      const { data } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true);

      if (data) {
        const matched = data.filter(m => {
          const searchable = `${m.uses || ""} ${m.category} ${m.name} ${m.description || ""}`.toLowerCase();
          return keywords.some(k => searchable.includes(k));
        });
        setMedicines(matched.slice(0, 6));
      }
      setLoading(false);
    };

    fetchMedicines();
  }, [diseases]);

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Finding relevant medicines...</div>;
  if (medicines.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-1.5">
        <Pill className="h-4 w-4" />
        Suggested Medicines
      </h4>
      <div className="grid gap-2">
        {medicines.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-2 border rounded-lg">
            {m.image_url ? (
              <img src={m.image_url} className="h-10 w-10 rounded object-cover" alt={m.name} />
            ) : (
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Pill className="h-5 w-5 text-muted-foreground" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.category} • {m.manufacturer}</p>
              {m.dosage && <p className="text-xs text-muted-foreground">Dosage: {m.dosage}</p>}
            </div>
            {m.price && <Badge variant="secondary" className="text-xs shrink-0">₹{m.price}</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicineSuggestions;
