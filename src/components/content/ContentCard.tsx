import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Volume2, VolumeX, Loader2, ChevronRight, Bookmark, BookmarkCheck } from "lucide-react";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  imageUrls?: string[];
  videoUrl?: string | null;
  category?: string;
  contentType?: 'disease' | 'magazine' | 'manual';
  onClick?: () => void;
}

const ContentCard = ({ 
  id, 
  title, 
  description, 
  content, 
  imageUrls = [], 
  videoUrl,
  category,
  contentType,
  onClick 
}: ContentCardProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const bookmarked = contentType ? isBookmarked(contentType, id) : false;

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "te", name: "Telugu" },
    { code: "ta", name: "Tamil" },
    { code: "kn", name: "Kannada" },
  ];

  const handleTextToSpeech = async () => {
    if (!content && !description) {
      toast({
        title: "No content",
        description: "No text content available to read",
        variant: "destructive"
      });
      return;
    }

    setIsPlaying(true);
    try {
      const textToRead = content || description || "";
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
        description: "Failed to generate speech. Please try again.",
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

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
        onClick={() => onClick ? onClick() : setShowDetail(true)}
      >
        <div className="relative h-32 bg-muted">
          {imageUrls.length > 0 ? (
            <img 
              src={imageUrls[0]} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              📄
            </div>
          )}
          {category && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              {category}
            </Badge>
          )}
          {contentType && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(contentType, id);
              }}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-1">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
          <div className="flex items-center justify-end mt-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Images */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Video */}
            {videoUrl && (
              <video 
                src={videoUrl} 
                controls 
                className="w-full rounded-lg"
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
                disabled={!content && !description}
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

            {/* Description */}
            {description && (
              <div>
                <h4 className="font-bold mb-2">Description</h4>
                <p className="text-muted-foreground">{description}</p>
              </div>
            )}

            {/* Content */}
            {content && (
              <div>
                <h4 className="font-bold mb-2">Details</h4>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentCard;
