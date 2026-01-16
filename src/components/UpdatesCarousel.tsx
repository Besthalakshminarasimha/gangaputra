import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
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
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
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
                {currentUpdate.media_url && (
                  <img
                    src={currentUpdate.media_url}
                    alt={currentUpdate.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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

            {/* Play/Pause & Dots */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
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
