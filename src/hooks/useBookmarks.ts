import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ContentType = 'disease' | 'magazine' | 'manual';

// Helper to communicate with service worker for offline caching
const cacheBookmarkContent = async (contentType: ContentType, contentId: string, data: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_BOOKMARK',
      contentType,
      contentId,
      data,
    });
  }
};

const removeBookmarkCache = async (contentType: ContentType, contentId: string) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'REMOVE_BOOKMARK_CACHE',
      contentType,
      contentId,
    });
  }
};

export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('content_type, content_id')
      .eq('user_id', user.id);

    if (!error && data) {
      const ids: Record<string, boolean> = {};
      data.forEach((b) => {
        ids[`${b.content_type}-${b.content_id}`] = true;
      });
      setBookmarkedIds(ids);
    }
  };

  const isBookmarked = useCallback((contentType: ContentType, contentId: string) => {
    return !!bookmarkedIds[`${contentType}-${contentId}`];
  }, [bookmarkedIds]);

  const toggleBookmark = async (contentType: ContentType, contentId: string, contentData?: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark content",
        variant: "destructive",
      });
      return;
    }

    const key = `${contentType}-${contentId}`;
    const isCurrentlyBookmarked = bookmarkedIds[key];

    if (isCurrentlyBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove bookmark",
          variant: "destructive",
        });
      } else {
        setBookmarkedIds(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        // Remove from offline cache
        removeBookmarkCache(contentType, contentId);
        toast({
          title: "Removed",
          description: "Bookmark removed",
        });
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add bookmark",
          variant: "destructive",
        });
      } else {
        setBookmarkedIds(prev => ({ ...prev, [key]: true }));
        // Cache content for offline access if data provided
        if (contentData) {
          cacheBookmarkContent(contentType, contentId, contentData);
        }
        toast({
          title: "Bookmarked",
          description: "Saved for offline access",
        });
      }
    }
  };

  return { isBookmarked, toggleBookmark, refreshBookmarks: fetchBookmarks };
};