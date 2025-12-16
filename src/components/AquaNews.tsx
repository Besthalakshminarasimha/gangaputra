import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  Newspaper, 
  RefreshCw, 
  TrendingUp, 
  Cpu, 
  AlertTriangle, 
  FileText, 
  Cloud, 
  Ship,
  FlaskConical
} from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  category: string;
  date: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Market Update": <TrendingUp className="h-4 w-4" />,
  "Technology": <Cpu className="h-4 w-4" />,
  "Disease Alert": <AlertTriangle className="h-4 w-4" />,
  "Policy": <FileText className="h-4 w-4" />,
  "Weather": <Cloud className="h-4 w-4" />,
  "Export": <Ship className="h-4 w-4" />,
  "Research": <FlaskConical className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  "Market Update": "bg-green-500/10 text-green-600 border-green-500/20",
  "Technology": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Disease Alert": "bg-red-500/10 text-red-600 border-red-500/20",
  "Policy": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Weather": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  "Export": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Research": "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

const AquaNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-aqua-news');

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Failed to fetch news. Please try again.');
        return;
      }

      if (data?.success && data?.news) {
        setNews(data.news);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      } else {
        setError(data?.error || 'Failed to load news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to connect. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Daily Aqua News</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdated}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNews}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNews} 
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-3 w-24 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`gap-1 ${categoryColors[item.category] || 'bg-muted'}`}
                  >
                    {categoryIcons[item.category]}
                    {item.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors mt-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.summary}
                </p>
                <p className="text-xs text-muted-foreground mt-3 font-medium">
                  Source: {item.source}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && news.length === 0 && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No news available at the moment.</p>
            <Button variant="outline" onClick={fetchNews} className="mt-4">
              Load News
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AquaNews;
