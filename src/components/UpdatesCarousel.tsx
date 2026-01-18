import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, Share2, Link, ImageOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CarouselUpdate {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string | null;
  content: string | null;
  is_active: boolean;
  display_order: number;
}

const UpdatesCarousel = () => {
  const [updates, setUpdates] = useState<CarouselUpdate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const viewedUpdatesRef = useRef<Set<string>>(new Set());

  // Track view for analytics
  const trackView = useCallback(async (updateId: string, viewType: 'view' | 'click' = 'view') => {
    // Only track each view once per session
    const trackingKey = `${updateId}-${viewType}`;
    if (viewedUpdatesRef.current.has(trackingKey)) return;
    
    viewedUpdatesRef.current.add(trackingKey);
    
    try {
      await supabase.from('carousel_analytics').insert({
        update_id: updateId,
        view_type: viewType,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the UI
      console.error('Failed to track carousel view:', error);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();

    // Real-time subscription
    const channel = supabase
      .channel('carousel-updates-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_carousel_updates'
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track view when slide changes
  useEffect(() => {
    if (updates.length > 0 && updates[currentIndex]) {
      trackView(updates[currentIndex].id, 'view');
    }
  }, [currentIndex, updates, trackView]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || updates.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % updates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, updates.length]);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('admin_carousel_updates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + updates.length) % updates.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % updates.length);
  };

  const handleCardClick = () => {
    if (updates[currentIndex]) {
      trackView(updates[currentIndex].id, 'click');
    }
  };

  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'whatsapp') => {
    const update = updates[currentIndex];
    if (!update) return;

    const shareUrl = `${window.location.origin}/dashboard?update=${update.id}`;
    const shareText = `${update.title}${update.description ? ` - ${update.description}` : ''}`;

    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        } catch {
          toast.error("Failed to copy link");
        }
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 bg-muted animate-pulse rounded-xl" />
    );
  }

  if (updates.length === 0) {
    return null;
  }

  const currentUpdate = updates[currentIndex];

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUpdate.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Media Content */}
            {currentUpdate.media_type === 'video' && currentUpdate.media_url ? (
              <div className="relative aspect-video bg-black">
                <video
                  src={currentUpdate.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-lg">{currentUpdate.title}</h3>
                  {currentUpdate.description && (
                    <p className="text-sm text-white/80 mt-1">{currentUpdate.description}</p>
                  )}
                </div>
              </div>
            ) : currentUpdate.media_type === 'image' || currentUpdate.media_type === 'gif' ? (
              <div className="relative aspect-video bg-muted">
                {currentUpdate.media_url ? (
                  <img
                    src={currentUpdate.media_url}
                    alt={currentUpdate.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <ImageOff className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-lg">{currentUpdate.title}</h3>
                  {currentUpdate.description && (
                    <p className="text-sm text-white/80 mt-1">{currentUpdate.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 min-h-[200px] flex flex-col justify-center bg-gradient-to-br from-primary to-secondary text-white">
                <h3 className="font-bold text-xl mb-2">{currentUpdate.title}</h3>
                {currentUpdate.description && (
                  <p className="text-white/90 mb-3">{currentUpdate.description}</p>
                )}
                {currentUpdate.content && (
                  <p className="text-white/80 text-sm">{currentUpdate.content}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        {updates.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Play/Pause, Share & Dots */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm rounded-full transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  <DropdownMenuItem onClick={() => handleShare('copy')}>
                    <Link className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('facebook')}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Share on Facebook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm rounded-full transition-all duration-200"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {updates.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdatesCarousel;
