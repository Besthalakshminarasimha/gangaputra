import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNotificationPreferences } from "./useNotificationPreferences";
import { usePushNotifications } from "./usePushNotifications";
import { useToast } from "./use-toast";

interface RateData {
  count_range: string;
  rate_per_kg: number;
}

interface LocationRates {
  location: string;
  state: string;
  rates: RateData[];
}

interface PriceAlert {
  location: string;
  count: string;
  previousRate: number;
  currentRate: number;
  changePercent: number;
  direction: 'up' | 'down';
}

const PRICE_CHANGE_THRESHOLD = 5; // 5% change triggers alert
const STORAGE_KEY = 'previous_shrimp_rates';

export const usePriceAlerts = () => {
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { showLocalNotification, permission: pushPermission } = usePushNotifications();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const getPreviousRates = useCallback((): Record<string, number> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading previous rates:', error);
    }
    return {};
  }, []);

  const savePreviousRates = useCallback((rates: LocationRates[]) => {
    try {
      const rateMap: Record<string, number> = {};
      rates.forEach(loc => {
        loc.rates.forEach(rate => {
          const key = `${loc.location}_${rate.count_range}`;
          rateMap[key] = rate.rate_per_kg;
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rateMap));
    } catch (error) {
      console.error('Error saving previous rates:', error);
    }
  }, []);

  const checkPriceChanges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('fetch-shrimp-rates');

      if (error || !data?.success || !data?.data) {
        console.error('Error fetching rates for alerts:', error);
        return;
      }

      const currentRates: LocationRates[] = data.data;
      const previousRates = getPreviousRates();
      const newAlerts: PriceAlert[] = [];

      // Check for significant changes
      currentRates.forEach(loc => {
        loc.rates.forEach(rate => {
          const key = `${loc.location}_${rate.count_range}`;
          const previousRate = previousRates[key];

          if (previousRate && previousRate > 0) {
            const changePercent = ((rate.rate_per_kg - previousRate) / previousRate) * 100;
            
            if (Math.abs(changePercent) >= PRICE_CHANGE_THRESHOLD) {
              newAlerts.push({
                location: loc.location,
                count: rate.count_range,
                previousRate,
                currentRate: rate.rate_per_kg,
                changePercent: Math.round(changePercent * 10) / 10,
                direction: changePercent > 0 ? 'up' : 'down',
              });
            }
          }
        });
      });

      // Trigger notifications for significant changes
      if (newAlerts.length > 0 && preferences.push_price_alerts) {
        setAlerts(newAlerts);

        const significantAlert = newAlerts.reduce((max, alert) => 
          Math.abs(alert.changePercent) > Math.abs(max.changePercent) ? alert : max
        );

        toast({
          title: `Price ${significantAlert.direction === 'up' ? '📈 Increased' : '📉 Decreased'}`,
          description: `${significantAlert.location} Count ${significantAlert.count}: ₹${significantAlert.previousRate} → ₹${significantAlert.currentRate} (${significantAlert.changePercent > 0 ? '+' : ''}${significantAlert.changePercent}%)`,
        });

        if (pushPermission === 'granted') {
          showLocalNotification(
            `Shrimp Price ${significantAlert.direction === 'up' ? 'Increase' : 'Drop'} Alert!`,
            {
              body: `${significantAlert.location}: Count ${significantAlert.count} is now ₹${significantAlert.currentRate}/kg (${significantAlert.changePercent > 0 ? '+' : ''}${significantAlert.changePercent}%)`,
              tag: 'price-alert',
              data: { url: '/dashboard' },
            }
          );
        }
      }

      // Save current rates for next comparison
      savePreviousRates(currentRates);
      setLastChecked(new Date().toISOString());
    } catch (error) {
      console.error('Error checking price changes:', error);
    }
  }, [user, preferences.push_price_alerts, pushPermission, showLocalNotification, toast, getPreviousRates, savePreviousRates]);

  // Check prices on mount and periodically
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkPriceChanges();

    // Check every 30 minutes
    const interval = setInterval(checkPriceChanges, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, checkPriceChanges]);

  const dismissAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    lastChecked,
    checkPriceChanges,
    dismissAlerts,
  };
};
