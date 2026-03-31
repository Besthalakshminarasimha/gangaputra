import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CloudSun,
  Umbrella,
} from "lucide-react";

interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
}

interface CurrentWeather {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  humidity: number;
}

const weatherDescriptions: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: "Clear sky", icon: <Sun className="h-5 w-5 text-yellow-500" /> },
  1: { label: "Mainly clear", icon: <Sun className="h-5 w-5 text-yellow-500" /> },
  2: { label: "Partly cloudy", icon: <CloudSun className="h-5 w-5 text-blue-400" /> },
  3: { label: "Overcast", icon: <Cloud className="h-5 w-5 text-muted-foreground" /> },
  45: { label: "Foggy", icon: <Cloud className="h-5 w-5 text-muted-foreground" /> },
  48: { label: "Rime fog", icon: <Cloud className="h-5 w-5 text-muted-foreground" /> },
  51: { label: "Light drizzle", icon: <CloudRain className="h-5 w-5 text-blue-500" /> },
  53: { label: "Moderate drizzle", icon: <CloudRain className="h-5 w-5 text-blue-500" /> },
  55: { label: "Dense drizzle", icon: <CloudRain className="h-5 w-5 text-blue-600" /> },
  61: { label: "Slight rain", icon: <CloudRain className="h-5 w-5 text-blue-500" /> },
  63: { label: "Moderate rain", icon: <CloudRain className="h-5 w-5 text-blue-600" /> },
  65: { label: "Heavy rain", icon: <CloudRain className="h-5 w-5 text-blue-700" /> },
  80: { label: "Rain showers", icon: <Umbrella className="h-5 w-5 text-blue-500" /> },
  81: { label: "Moderate showers", icon: <Umbrella className="h-5 w-5 text-blue-600" /> },
  82: { label: "Violent showers", icon: <Umbrella className="h-5 w-5 text-blue-700" /> },
  95: { label: "Thunderstorm", icon: <CloudRain className="h-5 w-5 text-purple-600" /> },
};

const getWeatherInfo = (code: number) =>
  weatherDescriptions[code] ?? { label: "Unknown", icon: <Cloud className="h-5 w-5" /> };

const getPondAdvisory = (forecast: DailyForecast[]) => {
  const advisories: { message: string; severity: "warning" | "info" | "destructive" }[] = [];
  const today = forecast[0];
  if (!today) return advisories;

  if (today.tempMax > 34)
    advisories.push({ message: "High temperature alert – increase aeration and monitor DO levels", severity: "destructive" });
  if (today.tempMin < 20)
    advisories.push({ message: "Low temperature – reduce feeding; fish metabolism slows", severity: "warning" });
  if (today.precipitation > 30)
    advisories.push({ message: "Heavy rain expected – check pond bunds and overflow outlets", severity: "destructive" });
  if (today.precipitation > 10 && today.precipitation <= 30)
    advisories.push({ message: "Rain expected – salinity may drop; prepare lime", severity: "warning" });
  if (today.windSpeed > 30)
    advisories.push({ message: "Strong winds – secure aerators and check pond covers", severity: "warning" });

  const cumulativeRain = forecast.slice(0, 3).reduce((s, d) => s + d.precipitation, 0);
  if (cumulativeRain > 60)
    advisories.push({ message: "Sustained rainfall over 3 days – risk of pond overflow and dilution", severity: "destructive" });

  if (advisories.length === 0)
    advisories.push({ message: "Conditions look good for normal farm operations", severity: "info" });

  return advisories;
};

const WeatherForecast = () => {
  const [latitude, setLatitude] = useState("16.3067"); // default Guntur, AP
  const [longitude, setLongitude] = useState("80.4365");
  const [locationName, setLocationName] = useState("Guntur, AP");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWeather = async (lat: string, lon: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean,weather_code&timezone=auto&forecast_days=7`
      );
      if (!res.ok) throw new Error("Weather API error");
      const data = await res.json();

      setCurrent({
        temperature: data.current.temperature_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
      });

      const days: DailyForecast[] = data.daily.time.map((d: string, i: number) => ({
        date: d,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        precipitation: data.daily.precipitation_sum[i],
        windSpeed: data.daily.wind_speed_10m_max[i],
        humidity: data.daily.relative_humidity_2m_mean?.[i] ?? 0,
        weatherCode: data.daily.weather_code[i],
      }));
      setDaily(days);
    } catch {
      toast({ title: "Weather Error", description: "Could not fetch forecast data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(latitude, longitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation not available", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setLatitude(lat);
        setLongitude(lon);
        setLocationName("My Location");
        fetchWeather(lat, lon);
      },
      () => toast({ title: "Location denied", description: "Please allow location access", variant: "destructive" })
    );
  };

  const advisories = getPondAdvisory(daily);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather & Pond Advisory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location controls */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="w-28" />
            <Input placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="w-28" />
            <Button size="sm" onClick={() => fetchWeather(latitude, longitude)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleUseMyLocation}>
            <MapPin className="h-4 w-4 mr-1" /> Use My Location
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Current weather */}
            {current && (
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getWeatherInfo(current.weatherCode).icon}
                  <div>
                    <p className="text-2xl font-bold">{current.temperature}°C</p>
                    <p className="text-sm text-muted-foreground">{getWeatherInfo(current.weatherCode).label} · {locationName}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Wind className="h-4 w-4" /> {current.windSpeed} km/h
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="h-4 w-4" /> {current.humidity}%
                  </div>
                </div>
              </div>
            )}

            {/* Pond advisories */}
            {advisories.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Pond Management Advisories
                </p>
                {advisories.map((a, i) => (
                  <Badge
                    key={i}
                    variant={a.severity === "destructive" ? "destructive" : a.severity === "warning" ? "outline" : "secondary"}
                    className="block w-full text-left py-1.5 px-3 whitespace-normal"
                  >
                    {a.message}
                  </Badge>
                ))}
              </div>
            )}

            {/* 7-day forecast */}
            <div>
              <p className="font-semibold text-sm mb-2">7-Day Forecast</p>
              <div className="grid grid-cols-7 gap-1 overflow-x-auto">
                {daily.map((d) => (
                  <div key={d.date} className="bg-muted rounded-lg p-2 text-center text-xs space-y-1">
                    <p className="font-medium">{new Date(d.date).toLocaleDateString("en", { weekday: "short" })}</p>
                    {getWeatherInfo(d.weatherCode).icon}
                    <div className="flex items-center justify-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      <span className="font-bold">{d.tempMax}°</span>
                      <span className="text-muted-foreground">{d.tempMin}°</span>
                    </div>
                    {d.precipitation > 0 && (
                      <p className="text-blue-500 flex items-center justify-center gap-0.5">
                        <Droplets className="h-3 w-3" /> {d.precipitation}mm
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherForecast;
