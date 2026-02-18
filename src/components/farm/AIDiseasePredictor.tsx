import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, AlertTriangle, Loader2, Brain, Stethoscope } from "lucide-react";

interface PredictionResult {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

const AIDiseasePredictor = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image under 5MB",
          variant: "destructive",
        });
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

  const analyzeDisease = async () => {
    if (!imageBase64 && !symptoms.trim()) {
      toast({
        title: "Input Required",
        description: "Please upload an image or describe symptoms",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-disease-predict', {
        body: {
          symptoms: symptoms.trim() || null,
          imageBase64: imageBase64 || null,
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setResult({
        disease: data.disease,
        confidence: data.confidence,
        treatment: data.treatment,
        prevention: data.prevention,
        severity: data.severity,
      });

      toast({
        title: "Analysis Complete",
        description: `Identified: ${data.disease} (${data.confidence}% confidence)`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not complete the analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
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

  return (
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
                <img 
                  src={imagePreview} 
                  alt="Uploaded specimen" 
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="space-y-2">
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or take a photo (max 5MB)
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
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

        {/* Analyze Button */}
        <Button 
          onClick={analyzeDisease} 
          className="w-full"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Stethoscope className="h-4 w-4 mr-2" />
              Analyze Disease
            </>
          )}
        </Button>

        {/* Results Panel */}
        {result && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg">Diagnosis Result</h4>
              <Badge className={getSeverityColor(result.severity)}>
                {result.severity.toUpperCase()} Severity
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">{result.disease}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {result.confidence}%
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-medium mb-1">Recommended Treatment:</p>
                <p className="text-sm text-muted-foreground">{result.treatment}</p>
              </div>

              <div className="border-t pt-3">
                <p className="font-medium mb-1">Prevention Measures:</p>
                <p className="text-sm text-muted-foreground">{result.prevention}</p>
              </div>

              <div className="bg-yellow-500/10 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  This is an AI-based prediction. Always consult a qualified aquaculture 
                  veterinarian for accurate diagnosis and treatment.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDiseasePredictor;
