import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_daily_updates: boolean;
  email_trade_alerts: boolean;
  email_price_alerts: boolean;
  push_daily_updates: boolean;
  push_trade_alerts: boolean;
  push_price_alerts: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_daily_updates: true,
  email_trade_alerts: true,
  email_price_alerts: true,
  push_daily_updates: true,
  push_trade_alerts: true,
  push_price_alerts: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences for new user
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...defaultPreferences })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
        } else if (newData) {
          setPreferences(newData);
        }
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    setSaving(true);
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preference:', error);
        setPreferences(preferences); // Revert on error
        toast({
          title: "Error",
          description: "Failed to update notification preference",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Preference Updated",
          description: "Your notification preference has been saved",
        });
      }
    } catch (error) {
      console.error('Error in updatePreference:', error);
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const updateAllPreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    setSaving(true);
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        setPreferences(preferences);
        toast({
          title: "Error",
          description: "Failed to update notification preferences",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Preferences Updated",
          description: "Your notification preferences have been saved",
        });
      }
    } catch (error) {
      console.error('Error in updateAllPreferences:', error);
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updateAllPreferences,
    refetch: fetchPreferences,
  };
};
