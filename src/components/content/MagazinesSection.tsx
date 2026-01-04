import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Loader2, BookOpen, Download, Volume2, VolumeX, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Magazine {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  content: string | null;
  published_date: string | null;
}

const MagazinesSection = () => {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "te", name: "Telugu" },
    { code: "ta", name: "Tamil" },
    { code: "kn", name: "Kannada" },
  ];

  useEffect(() => {
    fetchMagazines();
  }, []);

  const fetchMagazines = async () => {
    const { data, error } = await supabase
      .from('magazines')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) {
      console.error('Error fetching magazines:', error);
    } else {
      setMagazines(data || []);
    }
    setLoading(false);
  };

  const handleTextToSpeech = async () => {
    if (!selectedMagazine?.content && !selectedMagazine?.description) {
      toast({
        title: "No content",
        description: "No text content available to read",
        variant: "destructive"
      });
      return;
    }

    setIsPlaying(true);
    try {
      const textToRead = selectedMagazine?.content || selectedMagazine?.description || "";
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: textToRead, language: selectedLanguage }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mp3' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Error",
        description: "Failed to generate speech",
        variant: "destructive"
      });
      setIsPlaying(false);
    }
  };

  const stopSpeech = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
  };

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
          <BookOpen className="h-5 w-5" />
          Aqua Magazines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {magazines.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No magazines available yet. Check back later!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {magazines.map(magazine => (
              <Card 
                key={magazine.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => setSelectedMagazine(magazine)}
              >
                <div className="relative h-40 bg-muted">
                  {magazine.cover_image_url ? (
                    <img 
                      src={magazine.cover_image_url} 
                      alt={magazine.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      📰
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark('magazine', magazine.id);
                    }}
                  >
                    {isBookmarked('magazine', magazine.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-sm line-clamp-2">{magazine.title}</h3>
                  {magazine.published_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(magazine.published_date), 'MMM yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedMagazine} onOpenChange={() => setSelectedMagazine(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          {selectedMagazine && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMagazine.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedMagazine.cover_image_url && (
                  <img 
                    src={selectedMagazine.cover_image_url} 
                    alt={selectedMagazine.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}

                {/* TTS Controls */}
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant={isPlaying ? "destructive" : "default"}
                    onClick={isPlaying ? stopSpeech : handleTextToSpeech}
                  >
                    {isPlaying ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Listen
                      </>
                    )}
                  </Button>
                </div>

                {selectedMagazine.description && (
                  <p className="text-muted-foreground">{selectedMagazine.description}</p>
                )}

                {selectedMagazine.content && (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {selectedMagazine.content}
                  </div>
                )}

                {selectedMagazine.pdf_url && (
                  <Button className="w-full" asChild>
                    <a href={selectedMagazine.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MagazinesSection;
