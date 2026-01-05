import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bookmark, Bug, Newspaper, BookOpen, Trash2, Volume2, Loader2, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookmarkItem {
  id: string;
  content_type: string;
  content_id: string;
  created_at: string;
  content?: any;
}

const BookmarksSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTypes, setFilterTypes] = useState<string[]>(["disease", "magazine", "manual"]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      setLoading(false);
      return;
    }

    // Fetch content for each bookmark
    const bookmarksWithContent = await Promise.all(
      (data || []).map(async (bookmark) => {
        let content = null;
        const table = bookmark.content_type === 'disease' ? 'diseases' 
          : bookmark.content_type === 'magazine' ? 'magazines' 
          : 'crop_manuals';

        const { data: contentData } = await supabase
          .from(table)
          .select('*')
          .eq('id', bookmark.content_id)
          .maybeSingle();

        return { ...bookmark, content: contentData };
      })
    );

    setBookmarks(bookmarksWithContent.filter(b => b.content));
    setLoading(false);
  };

  const removeBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    } else {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast({
        title: "Removed",
        description: "Bookmark removed successfully",
      });
    }
  };

  const playTTS = async (text: string, id: string, language: string = 'en') => {
    if (playingId === id) return;
    
    setPlayingId(id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audio.onended = () => setPlayingId(null);
          await audio.play();
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      if (playingId === id) setPlayingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'disease': return <Bug className="h-4 w-4" />;
      case 'magazine': return <Newspaper className="h-4 w-4" />;
      case 'manual': return <BookOpen className="h-4 w-4" />;
      default: return <Bookmark className="h-4 w-4" />;
    }
  };

  const getTitle = (bookmark: BookmarkItem) => {
    return bookmark.content?.name || bookmark.content?.title || 'Unknown';
  };

  const getDescription = (bookmark: BookmarkItem) => {
    return bookmark.content?.description || bookmark.content?.symptoms || '';
  };

  const toggleFilter = (type: string) => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      // Filter by type
      if (!filterTypes.includes(bookmark.content_type)) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = getTitle(bookmark).toLowerCase();
        const description = getDescription(bookmark).toLowerCase();
        return title.includes(query) || description.includes(query);
      }
      
      return true;
    });
  }, [bookmarks, searchQuery, filterTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No bookmarks yet</p>
        <p className="text-sm">Save your favorite content from Diseases, Magazines, and Manuals</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={filterTypes.includes("disease")}
              onCheckedChange={() => toggleFilter("disease")}
            >
              <Bug className="h-4 w-4 mr-2" />
              Diseases
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterTypes.includes("magazine")}
              onCheckedChange={() => toggleFilter("magazine")}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              Magazines
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterTypes.includes("manual")}
              onCheckedChange={() => toggleFilter("manual")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manuals
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Count */}
      {(searchQuery || filterTypes.length < 3) && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
        </p>
      )}

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No bookmarks match your search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getIcon(bookmark.content_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{getTitle(bookmark)}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {bookmark.content_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getDescription(bookmark)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playTTS(
                        `${getTitle(bookmark)}. ${getDescription(bookmark)}`,
                        bookmark.id
                      )}
                      disabled={playingId === bookmark.id}
                    >
                      {playingId === bookmark.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBookmark(bookmark.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksSection;