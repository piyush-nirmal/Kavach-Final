import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Navigation, Search, Locate, Building2 } from 'lucide-react';
import { mockVaccinationCenters } from '@/data/mockData';
import { VaccinationCenter } from '@/types';
import GoogleMapComponent from '@/components/map/GoogleMap';


export default function Centers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [centers, setCenters] = useState<VaccinationCenter[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Search logic for local filtering
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

  const findNearbyCenters = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = new google.maps.LatLng(latitude, longitude);

        if (mapInstance) {
          mapInstance.panTo(userLocation);
          mapInstance.setZoom(14);

          const service = new google.maps.places.PlacesService(mapInstance);

          const request = {
            location: userLocation,
            radius: 5000,
            keyword: 'hospital' // search for hospitals/vaccination centers
          };

          service.nearbySearch(request, (results, status) => {
            setIsLoadingLocation(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const mappedResults = results.map((place) => ({
                id: place.place_id || Math.random().toString(),
                name: place.name || 'Unknown Center',
                address: place.vicinity || 'Address not available',
                phone: 'Contact via Maps', // API doesn't return phone in basic search
                latitude: place.geometry?.location?.lat() || 0,
                longitude: place.geometry?.location?.lng() || 0,
                distance: 'Nearby' // We could calculate real distance here
              }));
              setCenters(mappedResults);
            } else {
              console.error("Places API failed:", status);
            }
          });
        }
      },

      (error) => {
        console.error("Error getting location:", error);
        setIsLoadingLocation(false);

        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission was denied. Please allow location access in your browser settings to find nearby centers.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your device settings.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out. Please try again.";
            break;
        }
        alert(errorMessage);
      }

    );
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Find Centers</h1>
          <p className="text-muted-foreground text-sm">Vaccination centers near you</p>
        </div>
        <Button
          onClick={findNearbyCenters}
          disabled={isLoadingLocation}
          className="w-full md:w-auto"
        >
          {isLoadingLocation ? 'Locating...' : 'Use My Location'}
          <Locate className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Map */}
      <Card className="h-64 overflow-hidden relative">
        <div className="absolute inset-0">
          <GoogleMapComponent
            markers={filteredCenters.map(c => ({
              id: c.id,
              lat: c.latitude,
              lng: c.longitude,
              title: c.name
            }))}
            onMarkerClick={(id) => setSelectedCenter(String(id))}
            onMapLoad={setMapInstance}
          />
        </div>
      </Card>

      {/* Centers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-foreground">
            Nearby Centers ({filteredCenters.length})
          </h2>
        </div>

        {filteredCenters.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No centers found</p>
          </Card>
        ) : (
          filteredCenters.map((center, index) => (
            <Card
              key={center.id}
              className={`p-4 transition-all cursor-pointer ${selectedCenter === center.id ? 'border-primary ring-1 ring-primary' : ''
                }`}
              onClick={() => setSelectedCenter(center.id)}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground">{center.name}</h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {center.distance}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground truncate">
                      {center.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{center.phone}</p>
                  </div>

                  {selectedCenter === center.id && (
                    <div className="flex gap-2 mt-3 animate-fade-in">
                      <Button
                        size="sm"
                        className="flex-1 gradient-primary text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(center.latitude, center.longitude);
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(center.phone);
                        }}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

