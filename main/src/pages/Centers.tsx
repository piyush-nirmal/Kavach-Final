import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/ui/GlowCard';
import {
  MapPin, Phone, Navigation, Search, Locate,
  Building2, Loader2, Star, Clock
} from 'lucide-react';
import { VaccinationCenter } from '@/types';
import LeafletMap from '@/components/map/LeafletMap';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';

// ─── Overpass API helper ──────────────────────────────────────────────────────
async function fetchNearbyCenters(lat: number, lng: number, radiusMeters = 5000): Promise<VaccinationCenter[]> {
  // Query hospitals, clinics, doctors, pharmacies within radius
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  if (!response.ok) throw new Error('Overpass API request failed');

  const data = await response.json();

  return (data.elements as any[])
    .filter((el) => el.tags?.name) // only named places
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLng = el.lon ?? el.center?.lon ?? 0;
      const distKm = getDistanceKm(lat, lng, elLat, elLng);
      return {
        id: String(el.id),
        name: el.tags.name,
        address: [
          el.tags['addr:housenumber'],
          el.tags['addr:street'],
          el.tags['addr:city'] || el.tags['addr:suburb'],
        ]
          .filter(Boolean)
          .join(', ') || 'Address not available',
        phone: el.tags.phone || el.tags['contact:phone'] || 'Not available',
        latitude: elLat,
        longitude: elLng,
        distance: `${distKm.toFixed(1)} km`,
      } as VaccinationCenter & { distance: string };
    })
    .sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Centers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [centers, setCenters] = useState<(VaccinationCenter & { distance?: string })[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const filteredCenters = centers.filter(
    (center) =>
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGetDirections = (centerLat: number, centerLng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${centerLat},${centerLng}`,
      '_blank'
    );
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };

  const findNearbyCenters = async () => {
    setIsLoadingLocation(true);
    setErrorMessage('');

    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      setUserLocation({ lat: latitude, lng: longitude });

      // Pan map to user location
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 14);
      }

      const results = await fetchNearbyCenters(latitude, longitude, 5000);

      if (results.length === 0) {
        setErrorMessage('No centers found within 5km. Try a larger area.');
      }

      setCenters(results);
    } catch (error: any) {
      const errStr = String(error).toLowerCase();
      if (errStr.includes('permission')) {
        setErrorMessage('Location permission was denied. Please allow location access in your device settings.');
      } else if (errStr.includes('unavailable')) {
        setErrorMessage('Location information is unavailable. Please check if your GPS is enabled.');
      } else if (errStr.includes('timeout')) {
        setErrorMessage('Location request timed out. Please try again.');
      } else {
        setErrorMessage('Unable to retrieve nearby centers. Please try again.');
      }
      console.error('Error finding nearby centers:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600">
              Find Centers
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Discover vaccination centers near you
            </p>
          </div>
          <Button
            onClick={findNearbyCenters}
            disabled={isLoadingLocation}
            className="btn-premium w-full md:w-auto text-white rounded-xl"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <Locate className="mr-2 h-4 w-4" />
                Use My Location
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
          {errorMessage}
        </div>
      )}

      {/* Search */}
      <div className="animate-slide-up delay-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-violet-500" />
          <Input
            placeholder="Search centers by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      {/* Map */}
      <Card className="h-72 overflow-hidden relative rounded-2xl border-0 shadow-card animate-slide-up delay-200">
        <div className="absolute inset-0">
          <LeafletMap
            markers={filteredCenters.map((c) => ({
              id: c.id,
              lat: c.latitude,
              lng: c.longitude,
              title: c.name,
            }))}
            center={userLocation ?? { lat: 20.5937, lng: 78.9629 }}
            zoom={userLocation ? 13 : 5}
            onMarkerClick={(id) => setSelectedCenter(String(id))}
            onMapLoad={(map) => { mapRef.current = map; }}
          />
        </div>
        {/* Map Overlay Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
      </Card>

      {/* Centers List */}
      <div className="animate-slide-up delay-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Nearby Centers</h2>
            <p className="text-sm text-muted-foreground">
              {filteredCenters.length} {filteredCenters.length === 1 ? 'center' : 'centers'} found
            </p>
          </div>
          {filteredCenters.length > 0 && (
            <Badge variant="secondary" className="bg-violet-50 text-violet-600 border-0">
              <MapPin className="h-3 w-3 mr-1" />
              Within 5km
            </Badge>
          )}
        </div>

        {filteredCenters.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-slate-50 to-gray-50 border-dashed border-2 border-slate-200">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">No Centers Found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Use the "Use My Location" button above to discover vaccination centers near you.
            </p>
            <Button
              onClick={findNearbyCenters}
              variant="outline"
              className="rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
              disabled={isLoadingLocation}
            >
              <Locate className="h-4 w-4 mr-2" />
              Find Nearby Centers
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCenters.map((center, index) => (
              <GlowCard
                key={center.id}
                glowColor="primary"
                className="animate-slide-up"
                hover={true}
                onClick={() => setSelectedCenter(selectedCenter === center.id ? null : center.id)}
              >
                <div className={`p-4 ${selectedCenter === center.id ? 'ring-2 ring-violet-500 rounded-2xl' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                      <span className="font-bold text-white text-lg">{index + 1}</span>
                    </div>

                    {/* Center Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-foreground text-base">{center.name}</h4>
                        {(center as any).distance && (
                          <Badge variant="outline" className="text-xs flex-shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {(center as any).distance}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                        <p className="text-sm truncate">{center.address}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                        <p className="text-sm">{center.phone}</p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${star <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">4.0</span>
                      </div>

                      {/* Action Buttons */}
                      {selectedCenter === center.id && (
                        <div className="flex gap-2 mt-4 animate-slide-up">
                          <Button
                            size="sm"
                            className="flex-1 btn-premium text-white rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(center.latitude, center.longitude);
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(center.phone);
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
