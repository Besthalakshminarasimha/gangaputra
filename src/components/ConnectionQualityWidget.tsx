import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalHigh, 
  SignalMedium, 
  SignalLow,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionMetrics {
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  lastSync: Date | null;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
}

const ConnectionQualityWidget = () => {
  const { isOnline } = useOnlineStatus();
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    quality: 'good',
    lastSync: null,
    syncStatus: 'synced',
  });
  const [isChecking, setIsChecking] = useState(false);

  const measureLatency = useCallback(async (): Promise<number> => {
    if (!isOnline) return -1;
    
    const start = performance.now();
    try {
      // Use a lightweight query to measure latency
      await supabase.from('daily_updates').select('id').limit(1);
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return -1;
    }
  }, [isOnline]);

  const determineQuality = (latency: number): ConnectionMetrics['quality'] => {
    if (latency < 0) return 'offline';
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    if (latency < 600) return 'fair';
    return 'poor';
  };

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    setMetrics(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const latency = await measureLatency();
      const quality = determineQuality(latency);
      
      setMetrics({
        latency: latency >= 0 ? latency : 0,
        quality,
        lastSync: new Date(),
        syncStatus: quality === 'offline' ? 'offline' : 'synced',
      });
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        syncStatus: 'error',
      }));
    } finally {
      setIsChecking(false);
    }
  }, [measureLatency]);

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  useEffect(() => {
    if (!isOnline) {
      setMetrics(prev => ({
        ...prev,
        quality: 'offline',
        syncStatus: 'offline',
      }));
    } else {
      checkConnection();
    }
  }, [isOnline, checkConnection]);

  const getQualityIcon = () => {
    switch (metrics.quality) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case 'good':
        return <SignalHigh className="h-4 w-4 text-green-400" />;
      case 'fair':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <SignalLow className="h-4 w-4 text-orange-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4" />;
    }
  };

  const getQualityColor = () => {
    switch (metrics.quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getSyncIcon = () => {
    switch (metrics.syncStatus) {
      case 'synced':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'syncing':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'offline':
        return <WifiOff className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const formatLastSync = () => {
    if (!metrics.lastSync) return 'Never';
    const seconds = Math.floor((Date.now() - metrics.lastSync.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {getQualityIcon()}
                      <span className="text-sm font-medium capitalize">
                        {metrics.quality}
                      </span>
                      {metrics.latency > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {metrics.latency}ms
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getSyncIcon()}
                      <span>
                        {metrics.syncStatus === 'syncing' ? 'Syncing...' : `Synced ${formatLastSync()}`}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    checkConnection();
                  }}
                  disabled={isChecking}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {/* Quality bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getQualityColor()}`}
                  style={{ 
                    width: metrics.quality === 'excellent' ? '100%' :
                           metrics.quality === 'good' ? '75%' :
                           metrics.quality === 'fair' ? '50%' :
                           metrics.quality === 'poor' ? '25%' : '0%'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 text-xs">
            <p><strong>Connection:</strong> {isOnline ? 'Online' : 'Offline'}</p>
            <p><strong>Latency:</strong> {metrics.latency}ms</p>
            <p><strong>Quality:</strong> {metrics.quality}</p>
            <p><strong>Last Sync:</strong> {formatLastSync()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionQualityWidget;
