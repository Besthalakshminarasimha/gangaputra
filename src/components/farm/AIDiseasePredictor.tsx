import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, AlertTriangle, Loader2, Brain, Stethoscope, Save, History, Trash2, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { format } from "date-fns";
import MedicineSuggestions from "./MedicineSuggestions";
import DiagnosisPdfExport from "./DiagnosisPdfExport";

interface Diagnosis {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

interface DiagnosisRecord {
  id: string;
  symptoms: string | null;
  diagnoses: Diagnosis[];
  selected_diagnosis: string | null;
  notes: string | null;
  created_at: string;
}

const AIDiseasePredictor = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<Diagnosis[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Please upload an image under 5MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('diagnosis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setHistory((data || []).map((d: any) => ({
        ...d,
        diagnoses: Array.isArray(d.diagnoses) ? d.diagnoses : [],
      })));
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory && user) fetchHistory();
  }, [showHistory, user]);

  const analyzeDisease = async () => {
    if (!imageBase64 && !symptoms.trim()) {
      toast({ title: "Input Required", description: "Please upload an image or describe symptoms", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResults([]);
    setExpandedIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke('ai-disease-predict', {
        body: { symptoms: symptoms.trim() || null, imageBase64: imageBase64 || null }
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Analysis Error", description: data.error, variant: "destructive" });
        return;
      }

      const diagnoses: Diagnosis[] = data.diagnoses || [];
      setResults(diagnoses);
      toast({ title: "Analysis Complete", description: `Found ${diagnoses.length} possible diagnoses` });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ title: "Analysis Failed", description: "Could not complete the analysis. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveDiagnosis = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save diagnosis results", variant: "destructive" });
      return;
    }
    if (results.length === 0) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('diagnosis_history').insert({
        user_id: user.id,
        symptoms: symptoms.trim() || null,
        diagnoses: results as any,
        selected_diagnosis: results[0]?.disease || null,
      });
      if (error) throw error;
      toast({ title: "Saved", description: "Diagnosis saved to your history" });
      if (showHistory) fetchHistory();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: "Save Failed", description: "Could not save diagnosis", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('diagnosis_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(h => h.id !== id));
      toast({ title: "Deleted", description: "Record removed from history" });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRankLabel = (index: number) => {
    switch (index) {
      case 0: return "Most Likely";
      case 1: return "Possible";
      case 2: return "Less Likely";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Disease Predictor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Photo of Sick Fish/Shrimp</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="space-y-2">
                  <img src={imagePreview} alt="Uploaded specimen" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <Button variant="outline" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); setImageBase64(null); }}>
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="space-y-2">
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or take a photo (max 5MB)</p>
                  </div>
                  <Input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Symptoms Input */}
          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe Symptoms</Label>
            <Textarea
              id="symptoms"
              placeholder="E.g., white spots on shell, lethargy, reduced feeding, red discoloration, loose shell, white feces..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={analyzeDisease} className="flex-1" disabled={isAnalyzing}>
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Stethoscope className="h-4 w-4 mr-2" />Analyze Disease</>
              )}
            </Button>
            {results.length > 0 && user && (
              <Button variant="outline" onClick={saveDiagnosis} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Results - Top 3 Differential Diagnoses */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-lg">Differential Diagnoses</h4>
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-normal">
                        #{index + 1} {getRankLabel(index)}
                      </Badge>
                      <span className="font-medium">{result.disease}</span>
                      <span className="text-sm text-muted-foreground">({result.confidence}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity.toUpperCase()}
                      </Badge>
                      {expandedIndex === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {expandedIndex === index && (
                    <div className="p-3 pt-0 space-y-3">
                      <Separator />
                      <div>
                        <p className="font-medium mb-1 text-sm">Recommended Treatment:</p>
                        <p className="text-sm text-muted-foreground">{result.treatment}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 text-sm">Prevention Measures:</p>
                        <p className="text-sm text-muted-foreground">{result.prevention}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Medicine Suggestions */}
              <MedicineSuggestions diseases={results.map(r => r.disease)} />

              {/* Export & Share */}
              <div className="flex items-center justify-between">
                <DiagnosisPdfExport diagnoses={results} symptoms={symptoms} />
                <p className="text-xs text-muted-foreground">Export or share results</p>
              </div>

              <div className="bg-yellow-500/10 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700">
                  These are AI-based predictions. Always consult a qualified aquaculture veterinarian for accurate diagnosis.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      {user && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5" />
                Diagnosis History
              </CardTitle>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved diagnoses yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div key={record.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{record.selected_diagnosis || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(record.created_at), 'PPp')}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRecord(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {record.symptoms && (
                        <p className="text-xs text-muted-foreground">Symptoms: {record.symptoms}</p>
                      )}
                      {record.diagnoses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {record.diagnoses.map((d, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {d.disease} ({d.confidence}%)
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default AIDiseasePredictor;
