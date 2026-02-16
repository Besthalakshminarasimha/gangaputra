import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BulkImportProps {
  type: "hatcheries" | "medicines";
  onImportComplete: () => void;
}

const HATCHERY_HEADERS = ["name", "location", "region", "type", "species", "phone", "email", "website", "latitude", "longitude"];
const MEDICINE_HEADERS = ["name", "category", "manufacturer", "active_ingredient", "dosage", "price", "approved", "uses", "description"];

const BulkImport = ({ type, onImportComplete }: BulkImportProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const headers = type === "hatcheries" ? HATCHERY_HEADERS : MEDICINE_HEADERS;

  const downloadTemplate = () => {
    const csv = headers.join(",") + "\n";
    const example = type === "hatcheries"
      ? "Alpha Hatchery,Nellore,Andhra Pradesh,Private,L. vannamei,9394930100,info@alpha.com,https://alpha.com,14.4426,79.9865"
      : "Aqua-Safe Plus,Water Treatment,AquaPharm Ltd,Potassium Permanganate,1-2 ppm,450,true,Water disinfection,Pond treatment chemical";
    const blob = new Blob([csv + example + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headerLine = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    
    return lines.slice(1).map((line) => {
      const values = line.match(/(".*?"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, "").trim()) || [];
      const row: Record<string, string> = {};
      headerLine.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    }).filter((row) => Object.values(row).some((v) => v));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ title: "Please upload a CSV file", variant: "destructive" });
      return;
    }

    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast({ title: "No data rows found in CSV", variant: "destructive" });
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      const batchSize = 20;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const records = batch.map((row, idx) => {
          try {
            if (type === "hatcheries") {
              if (!row.name || !row.location || !row.region || !row.type || !row.species) {
                throw new Error(`Row ${i + idx + 2}: Missing required fields (name, location, region, type, species)`);
              }
              return {
                name: row.name,
                location: row.location,
                region: row.region,
                type: row.type,
                species: row.species,
                phone: row.phone || null,
                email: row.email || null,
                website: row.website || null,
                latitude: row.latitude ? parseFloat(row.latitude) : null,
                longitude: row.longitude ? parseFloat(row.longitude) : null,
                is_active: true,
              };
            } else {
              if (!row.name || !row.category || !row.manufacturer) {
                throw new Error(`Row ${i + idx + 2}: Missing required fields (name, category, manufacturer)`);
              }
              return {
                name: row.name,
                category: row.category,
                manufacturer: row.manufacturer,
                active_ingredient: row.active_ingredient || null,
                dosage: row.dosage || null,
                price: row.price ? parseFloat(row.price) : null,
                approved: row.approved?.toLowerCase() === "true",
                uses: row.uses || null,
                description: row.description || null,
                is_active: true,
              };
            }
          } catch (err: any) {
            errors.push(err.message);
            return null;
          }
        }).filter(Boolean);

        if (records.length > 0) {
          const { error } = await supabase.from(type).insert(records as any[]);
          if (error) {
            failed += records.length;
            errors.push(`Batch error: ${error.message}`);
          } else {
            success += records.length;
          }
        }
        failed += batch.length - records.length;
        setProgress(Math.round(((i + batch.length) / rows.length) * 100));
      }

      setResults({ success, failed, errors });
      if (success > 0) {
        toast({ title: `${success} ${type} imported successfully` });
        onImportComplete();
      }
    } catch (err: any) {
      toast({ title: "Import failed: " + err.message, variant: "destructive" });
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Bulk Import {type === "hatcheries" ? "Hatcheries" : "Medicines"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Download CSV Template
          </Button>
          <label className="cursor-pointer">
            <Button variant="default" size="sm" asChild disabled={importing}>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                {importing ? "Importing..." : "Upload CSV"}
              </span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        {importing && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Importing... {progress}%</p>
          </div>
        )}

        {results && (
          <div className="text-sm space-y-1 p-3 rounded bg-muted">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              {results.success} imported successfully
            </div>
            {results.failed > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                {results.failed} failed
              </div>
            )}
            {results.errors.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto text-xs text-muted-foreground">
                {results.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Required columns: {headers.filter((h) =>
            type === "hatcheries"
              ? ["name", "location", "region", "type", "species"].includes(h)
              : ["name", "category", "manufacturer"].includes(h)
          ).join(", ")}
        </p>
      </CardContent>
    </Card>
  );
};

export default BulkImport;
