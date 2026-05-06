import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Pill, Stethoscope } from "lucide-react";

const SharedHealthReport = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("health_reports")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();
      setReport(data);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!report) return <div className="p-8 text-center text-muted-foreground">Report not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-600" /> Aqua Health Report
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(report.created_at).toLocaleString()} · Farm traceability ID: {token?.slice(0, 8)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {report.symptoms && (
            <div>
              <h3 className="font-semibold text-sm mb-1">Reported symptoms</h3>
              <p className="text-sm text-muted-foreground">{report.symptoms}</p>
            </div>
          )}
          {report.image_url && <img src={report.image_url} alt="symptom" className="rounded-lg max-h-64" />}

          {report.diagnoses?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Diagnoses</h3>
              <div className="space-y-2">
                {report.diagnoses.map((d: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div className="flex justify-between">
                      <p className="font-medium">{d.disease}</p>
                      <Badge variant="outline">{d.severity?.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Confidence: {d.confidence}%</p>
                    <p className="text-sm mt-1"><b>Treatment:</b> {d.treatment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.medicines?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Pill className="h-4 w-4" /> Medicines</h3>
              <ul className="text-sm space-y-1">
                {report.medicines.map((m: any) => (
                  <li key={m.id} className="border-b py-1">
                    <b>{m.name}</b> — {m.category} {m.dosage && `· ${m.dosage}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.doctors?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Doctors</h3>
              <ul className="text-sm space-y-1">
                {report.doctors.map((d: any) => (
                  <li key={d.id}>{d.name} — {d.specialization} ({d.location})</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedHealthReport;
