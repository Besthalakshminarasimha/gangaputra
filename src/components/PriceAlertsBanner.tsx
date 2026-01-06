import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, X, IndianRupee } from "lucide-react";

const PriceAlertsBanner = () => {
  const { alerts, dismissAlerts } = usePriceAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {alerts.slice(0, 3).map((alert, index) => (
        <Card 
          key={`${alert.location}-${alert.count}-${index}`}
          className={`border-0 shadow-md ${
            alert.direction === 'up' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          } text-white`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {alert.direction === 'up' ? (
                  <TrendingUp className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-5 w-5 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{alert.location}</span>
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white text-xs"
                    >
                      Count {alert.count}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {alert.previousRate}
                    </span>
                    <span>→</span>
                    <span className="flex items-center font-bold">
                      <IndianRupee className="h-3 w-3" />
                      {alert.currentRate}
                    </span>
                    <span className="font-medium">
                      ({alert.changePercent > 0 ? '+' : ''}{alert.changePercent}%)
                    </span>
                  </div>
                </div>
              </div>
              {index === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAlerts}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {alerts.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          +{alerts.length - 3} more price alerts
        </p>
      )}
    </div>
  );
};

export default PriceAlertsBanner;
