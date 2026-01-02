import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bug } from "lucide-react";
import ContentCard from "./ContentCard";

interface Disease {
  id: string;
  name: string;
  category: 'shrimp' | 'fish';
  description: string | null;
  symptoms: string | null;
  treatment: string | null;
  prevention: string | null;
  image_urls: string[];
}

const DiseasesSection = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shrimp");

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    const { data, error } = await supabase
      .from('diseases')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching diseases:', error);
    } else {
      setDiseases(data || []);
    }
    setLoading(false);
  };

  const filteredDiseases = diseases.filter(d => d.category === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Disease Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shrimp">🦐 Shrimp Diseases</TabsTrigger>
            <TabsTrigger value="fish">🐟 Fish Diseases</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredDiseases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No diseases added yet. Check back later!
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredDiseases.map(disease => (
                  <ContentCard
                    key={disease.id}
                    id={disease.id}
                    title={disease.name}
                    description={disease.description}
                    content={`Symptoms:\n${disease.symptoms || 'N/A'}\n\nTreatment:\n${disease.treatment || 'N/A'}\n\nPrevention:\n${disease.prevention || 'N/A'}`}
                    imageUrls={disease.image_urls || []}
                    category={disease.category}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DiseasesSection;
