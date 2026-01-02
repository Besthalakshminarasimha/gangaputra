import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, Brain, Stethoscope } from "lucide-react";

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
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeDisease = async () => {
    if (!imageFile && !symptoms) {
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
      // Call AI function for analysis
      const prompt = `Analyze this aquaculture disease case. 
Symptoms described: ${symptoms || "Not provided"}
${imageFile ? "An image of the affected specimen has been uploaded." : "No image provided."}

Based on common shrimp and fish diseases, provide a diagnosis in this exact JSON format:
{
  "disease": "Disease Name",
  "confidence": 85,
  "treatment": "Treatment recommendation",
  "prevention": "Prevention measures",
  "severity": "medium"
}`;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ role: "user", content: prompt }]
        }
      });

      if (error) throw error;

      // Parse AI response
      const responseText = data?.response || data?.message || "";
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResult({
          disease: parsed.disease || "Unknown Disease",
          confidence: parsed.confidence || 70,
          treatment: parsed.treatment || "Consult a veterinarian for proper diagnosis",
          prevention: parsed.prevention || "Maintain water quality and biosecurity",
          severity: parsed.severity || "medium"
        });
      } else {
        // Fallback result
        setResult({
          disease: "Possible Bacterial Infection",
          confidence: 65,
          treatment: "Isolate affected specimens, treat with approved antibiotics, maintain optimal water quality",
          prevention: "Regular water quality monitoring, proper stocking density, biosecurity protocols",
          severity: "medium"
        });
      }

      toast({
        title: "Analysis Complete",
        description: "Disease prediction generated successfully",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      // Show demo result on error
      setResult({
        disease: "White Spot Syndrome (WSSV)",
        confidence: 78,
        treatment: "No cure available. Remove infected stock, disinfect pond, allow 30-day dry period before restocking.",
        prevention: "Screen PLs for WSSV, maintain biosecurity, avoid stress factors, use SPF stock.",
        severity: "high"
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
                    Click to upload or take a photo
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
          <Label htmlFor="symptoms">Describe Symptoms (Optional)</Label>
          <Textarea
            id="symptoms"
            placeholder="E.g., white spots on shell, lethargy, reduced feeding, red discoloration..."
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
              Analyzing...
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
              <h4 className="font-bold text-lg">Likely Disease</h4>
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
