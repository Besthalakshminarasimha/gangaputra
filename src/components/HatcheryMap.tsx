import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Hatchery {
  id: string;
  name: string;
  location: string;
  region: string;
  type: string;
  species: string;
  phone: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface HatcheryMapProps {
  hatcheries: Hatchery[];
}

// Fix default marker icon issue with Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const HatcheryMap = ({ hatcheries }: HatcheryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const mappableHatcheries = hatcheries.filter(
    (h) => h.latitude != null && h.longitude != null
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Center on India by default
    const center: L.LatLngExpression =
      mappableHatcheries.length > 0
        ? [mappableHatcheries[0].latitude!, mappableHatcheries[0].longitude!]
        : [15.5, 80.0];

    const map = L.map(mapRef.current).setView(center, 6);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mappableHatcheries.forEach((h) => {
      const marker = L.marker([h.latitude!, h.longitude!]).addTo(map);
      marker.bindPopup(`
        <div style="min-width:180px">
          <strong>${h.name}</strong><br/>
          <span>${h.location}, ${h.region}</span><br/>
          <span>Type: ${h.type}</span><br/>
          <span>Species: ${h.species}</span>
          ${h.phone ? `<br/><a href="tel:${h.phone}">📞 ${h.phone}</a>` : ""}
        </div>
      `);
    });

    // Fit bounds if multiple markers
    if (mappableHatcheries.length > 1) {
      const bounds = L.latLngBounds(
        mappableHatcheries.map((h) => [h.latitude!, h.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mappableHatcheries]);

  if (mappableHatcheries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No hatcheries with coordinates available for map view.</p>
          <p className="text-xs text-muted-foreground mt-1">Admin can add latitude/longitude to hatcheries to show them on the map.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hatchery Map ({mappableHatcheries.length} locations)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
      </CardContent>
    </Card>
  );
};

export default HatcheryMap;
