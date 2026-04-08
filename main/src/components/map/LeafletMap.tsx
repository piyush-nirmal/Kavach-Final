import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + bundlers issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Marker {
  id: string | number;
  lat: number;
  lng: number;
  title?: string;
}

interface LeafletMapProps {
  markers?: Marker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string | number) => void;
  onMapLoad?: (map: L.Map) => void;
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India

export default function LeafletMap({
  markers = [],
  center = defaultCenter,
  zoom = 5,
  onMarkerClick,
  onMapLoad,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (onMapLoad) onMapLoad(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (markers.length > 0) {
      const bounds = L.latLngBounds([]);
      markers.forEach((m) => {
        const marker = L.marker([m.lat, m.lng]);
        if (m.title) marker.bindPopup(`<b>${m.title}</b>`);
        if (onMarkerClick) marker.on('click', () => onMarkerClick(m.id));
        marker.addTo(markersLayerRef.current!);
        bounds.extend([m.lat, m.lng]);
      });
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [markers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center when it changes (e.g., after user location)
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  );
}
