import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Mail, Bell, TrendingUp, Newspaper, ShoppingCart, Loader2 } from "lucide-react";

const NotificationPreferences = () => {
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email_daily_updates" className="font-medium">Daily Updates</Label>
                <p className="text-sm text-muted-foreground">Receive important daily announcements</p>
              </div>
            </div>
            <Switch
              id="email_daily_updates"
              checked={preferences.email_daily_updates}
              onCheckedChange={(checked) => updatePreference('email_daily_updates', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email_trade_alerts" className="font-medium">Trade Alerts</Label>
                <p className="text-sm text-muted-foreground">Updates on your sell crop requests</p>
              </div>
            </div>
            <Switch
              id="email_trade_alerts"
              checked={preferences.email_trade_alerts}
              onCheckedChange={(checked) => updatePreference('email_trade_alerts', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email_price_alerts" className="font-medium">Price Alerts</Label>
                <p className="text-sm text-muted-foreground">Shrimp rate changes and market updates</p>
              </div>
            </div>
            <Switch
              id="email_price_alerts"
              checked={preferences.email_price_alerts}
              onCheckedChange={(checked) => updatePreference('email_price_alerts', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose which push notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push_daily_updates" className="font-medium">Daily Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified of important announcements</p>
              </div>
            </div>
            <Switch
              id="push_daily_updates"
              checked={preferences.push_daily_updates}
              onCheckedChange={(checked) => updatePreference('push_daily_updates', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push_trade_alerts" className="font-medium">Trade Alerts</Label>
                <p className="text-sm text-muted-foreground">Status updates on your requests</p>
              </div>
            </div>
            <Switch
              id="push_trade_alerts"
              checked={preferences.push_trade_alerts}
              onCheckedChange={(checked) => updatePreference('push_trade_alerts', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push_price_alerts" className="font-medium">Price Alerts</Label>
                <p className="text-sm text-muted-foreground">Real-time shrimp rate updates</p>
              </div>
            </div>
            <Switch
              id="push_price_alerts"
              checked={preferences.push_price_alerts}
              onCheckedChange={(checked) => updatePreference('push_price_alerts', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
