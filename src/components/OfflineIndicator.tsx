import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CachedContent {
  type: string;
  name: string;
  cachedAt: string;
}

const OfflineIndicator = () => {
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus();
  const [cachedContent, setCachedContent] = useState<CachedContent[]>([]);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        clearWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline, clearWasOffline]);

  useEffect(() => {
    const fetchCachedContent = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('bookmarks-cache-v1');
          const keys = await cache.keys();
          
          const content: CachedContent[] = [];
          for (const request of keys) {
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const type = pathParts[1] || 'content';
            const name = pathParts[pathParts.length - 1] || 'Unknown';
            
            const response = await cache.match(request);
            const cachedAt = response?.headers.get('date') || new Date().toISOString();
            
            content.push({
              type: type.charAt(0).toUpperCase() + type.slice(1),
              name: decodeURIComponent(name),
              cachedAt,
            });
          }
          setCachedContent(content);
        } catch (error) {
          console.error('Error fetching cached content:', error);
        }
      }
    };

    fetchCachedContent();
  }, [isOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <>
      {/* Floating offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in">
          <Card className="bg-amber-500 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">You're offline</p>
                    <p className="text-xs text-white/80">
                      {cachedContent.length > 0 
                        ? `${cachedContent.length} bookmarked items available`
                        : 'Bookmark content to access offline'
                      }
                    </p>
                  </div>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/20 text-white hover:bg-white/30 border-0"
                    >
                      <Database className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Available Offline Content
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                      {cachedContent.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No offline content</p>
                          <p className="text-sm">Bookmark content to access it offline</p>
                        </div>
                      ) : (
                        cachedContent.map((item, index) => (
                          <Card key={index} className="bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm truncate max-w-[200px]">
                                    {item.name}
                                  </p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {item.type}
                                  </Badge>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Cached
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reconnected notification */}
      {showReconnected && isOnline && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in">
          <Card className="bg-green-500 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                <p className="font-medium text-sm">Back online!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
