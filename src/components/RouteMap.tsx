import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption } from '../types.js';

interface RouteMapProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  hospitalName: string;
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  isLiveRerouted?: boolean;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originLat,
  originLng,
  destLat,
  destLng,
  hospitalName,
  routes,
  selectedRouteId,
  onSelectRoute,
  isLiveRerouted,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(originLat + destLat) / 2, (originLng + destLng) / 2],
        zoom: 13,
        zoomControl: true,
      });

      // High-contrast dark tile layer from CartoDB / OSM
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a> OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. Patient Marker (Pulsing Red)
    const patientIcon = L.divIcon({
      className: 'custom-pulsing-marker',
      html: `
        <div style="width: 28px; height: 28px; background: #ef4444; border: 3px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);">
          <span style="color: white; font-size: 14px; font-weight: bold;">🚨</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const patientMarker = L.marker([originLat, originLng], { icon: patientIcon }).addTo(layers);
    patientMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px;">
        <strong style="color: #ef4444; text-transform: uppercase;">Patient Emergency Origin</strong><br/>
        Hemodynamic Triage Active<br/>
        <span style="color: #94a3b8; font-size: 10px;">Lat: ${originLat.toFixed(4)}, Lng: ${originLng.toFixed(4)}</span>
      </div>
    `);

    // 2. Hospital Marker (Cyan)
    const hospitalIcon = L.divIcon({
      className: 'hospital-marker',
      html: `
        <div style="width: 32px; height: 32px; background: #06b6d4; border: 3px solid #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);">
          <span style="color: #0f172a; font-size: 16px; font-weight: 900;">🏥</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const hospitalMarker = L.marker([destLat, destLng], { icon: hospitalIcon }).addTo(layers);
    hospitalMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px;">
        <strong style="color: #38bdf8; text-transform: uppercase;">${hospitalName}</strong><br/>
        ICU & Emergency Bay Receiving<br/>
        <span style="color: #22c55e; font-weight: bold;">Advance Preparation Requested</span>
      </div>
    `);

    // 3. Draw Route Polylines
    const allLatLngs: [number, number][] = [];

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      let color = '#94a3b8';
      let weight = 4;
      let opacity = 0.5;

      if (isSelected) {
        if (route.traffic === 'LOW') color = '#10b981'; // Green
        else if (route.traffic === 'MEDIUM') color = '#f59e0b'; // Amber
        else color = '#ef4444'; // Red
        weight = 7;
        opacity = 0.95;
      } else {
        if (route.traffic === 'HEAVY') color = '#dc2626';
        weight = 3;
        opacity = 0.4;
      }

      if (route.id === 'route-live-bypass') {
        color = '#06b6d4'; // Bright Cyan for dynamic bypass
        weight = 8;
        opacity = 1.0;
      }

      const polyline = L.polyline(route.waypoints, {
        color,
        weight,
        opacity,
        dashArray: isSelected ? undefined : '5, 8',
      }).addTo(layers);

      route.waypoints.forEach((wp) => allLatLngs.push(wp));

      polyline.bindPopup(`
        <div style="font-family: inherit; font-size: 12px;">
          <strong style="color: ${color};">${route.name}</strong><br/>
          Distance: <strong>${route.distanceKm} km</strong> | ETA: <strong>${route.etaMinutes} min</strong><br/>
          Traffic Status: <strong>${route.traffic}</strong>
        </div>
      `);
    });

    // Fit bounds smoothly
    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] });
    }

    // Leaflet needs resize tick
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // clean up on unmount if needed
    };
  }, [originLat, originLng, destLat, destLng, routes, selectedRouteId, hospitalName, isLiveRerouted]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Route Options Bar over Map */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] flex flex-wrap gap-2 pointer-events-auto">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          return (
            <button
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md shadow-lg flex items-center space-x-2 border ${
                isSelected
                  ? 'bg-slate-900/95 text-white border-cyan-400 ring-2 ring-cyan-400/30'
                  : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-900'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  route.traffic === 'LOW'
                    ? 'bg-emerald-400'
                    : route.traffic === 'MEDIUM'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span>{route.name.split('—')[0].trim()}</span>
              <span className="font-mono text-cyan-300">({route.etaMinutes} min)</span>
              {route.isRecommended && (
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded uppercase">
                  Fastest
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Floating Speed & Status Badge at bottom */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-3 text-slate-300 shadow-xl">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">Live Route Telemetry</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Target Priority: <strong className="text-cyan-300">Emergency Green Corridor</strong></span>
      </div>
    </div>
  );
};
