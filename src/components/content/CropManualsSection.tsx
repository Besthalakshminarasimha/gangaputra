import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";
import ContentCard from "./ContentCard";

interface CropManual {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  image_urls: string[];
  video_url: string | null;
}

const CropManualsSection = () => {
  const [manuals, setManuals] = useState<CropManual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    const { data, error } = await supabase
      .from('crop_manuals')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching manuals:', error);
    } else {
      setManuals(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const cropCategories = [
    { name: "Vannamei Culture", icon: "🦐" },
    { name: "Rohu Culture", icon: "🐟" },
    { name: "Tilapia Culture", icon: "🐠" },
    { name: "Pangasius Culture", icon: "🐡" },
    { name: "Tiger Prawn", icon: "🦐" },
    { name: "Catla Culture", icon: "🐟" },
    { name: "Polyculture", icon: "🌊" },
    { name: "Ornamental Aquarium", icon: "🐠" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Crop Manuals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {manuals.length === 0 ? (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-4">
              Manuals coming soon! Available categories:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cropCategories.map(cat => (
                <Card key={cat.name} className="p-4 text-center opacity-60">
                  <span className="text-3xl block mb-2">{cat.icon}</span>
                  <p className="text-xs font-medium">{cat.name}</p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {manuals.map(manual => (
              <ContentCard
                key={manual.id}
                id={manual.id}
                title={manual.name}
                description={manual.description}
                content={manual.content}
                imageUrls={manual.image_urls || []}
                videoUrl={manual.video_url}
                contentType="manual"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CropManualsSection;
