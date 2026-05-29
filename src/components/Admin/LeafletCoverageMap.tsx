"use client";

import njMetroCounties from "@/data/nj-metro-counties.geojson";
import type { CoverageRegionConfig, CoverageStatus } from "@/types/coverage";
import type { GeoJsonObject } from "geojson";
import type { LatLngExpression, PathOptions } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [40.88, -74.15];
const DEFAULT_ZOOM = 9;
const MILES_TO_METERS = 1609.344;

const statusColors: Record<CoverageStatus, { fill: string; stroke: string }> = {
  active: { fill: "#5B7A5E", stroke: "#4A634D" },
  expanding: { fill: "#C4956A", stroke: "#A67B52" },
  waitlist: { fill: "#78716C", stroke: "#57534E" },
};

const countyStyle: PathOptions = {
  fillColor: "#5B7A5E",
  fillOpacity: 0.07,
  color: "#5B7A5E",
  weight: 1,
  opacity: 0.4,
};

const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick: (point: { lat: number; lng: number }) => void;
}) => {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

export interface LeafletCoverageMapProps {
  regions: CoverageRegionConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapClick: (point: { lat: number; lng: number }) => void;
  clickMarker?: { lat: number; lng: number } | null;
  showCounties?: boolean;
}

const LeafletCoverageMap = ({
  regions,
  selectedId,
  onSelect,
  onMapClick,
  clickMarker = null,
  showCounties = true,
}: LeafletCoverageMapProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleRegions = useMemo(
    () => regions.filter((region) => region.id !== "national-waitlist"),
    [regions]
  );

  if (!mounted) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 text-sm text-nurture-charcoal/60">
        Loading interactive map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white">
      <div className="border-b border-nurture-sage/10 px-4 py-2 text-xs text-nurture-charcoal/60">
        Scroll to zoom · drag to pan · click the map to set center and suggest a ZIP
        prefix
      </div>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={7}
        maxZoom={14}
        scrollWheelZoom
        className="h-[520px] w-full cursor-crosshair"
        aria-label="Interactive coverage map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showCounties ? (
          <GeoJSON
            data={njMetroCounties as GeoJsonObject}
            style={countyStyle}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.name;
              if (name) {
                layer.bindTooltip(name, { sticky: true, opacity: 0.9 });
              }
            }}
          />
        ) : null}

        {visibleRegions.map((region) => {
          const colors = statusColors[region.status];
          const selected = region.id === selectedId;
          const radiusMeters =
            region.radiusMiles *
            MILES_TO_METERS *
            Math.max(0.35, region.coverageRatio / 100);

          return (
            <Circle
              key={region.id}
              center={[region.center.lat, region.center.lng]}
              radius={radiusMeters}
              pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: selected ? 0.35 : 0.22,
                weight: selected ? 3 : 1.5,
                dashArray: region.status === "expanding" ? "6 4" : undefined,
              }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  onSelect(region.id);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <span className="font-semibold">{region.name}</span>
                <br />
                {region.coverageRatio}% capacity
              </Tooltip>
            </Circle>
          );
        })}

        {visibleRegions.map((region) => {
          const colors = statusColors[region.status];
          const selected = region.id === selectedId;
          return (
            <CircleMarker
              key={`${region.id}-center`}
              center={[region.center.lat, region.center.lng]}
              radius={selected ? 7 : 5}
              pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: 1,
                weight: selected ? 2 : 1,
              }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  onSelect(region.id);
                },
              }}
            />
          );
        })}

        {clickMarker ? (
          <CircleMarker
            center={[clickMarker.lat, clickMarker.lng]}
            radius={8}
            pathOptions={{
              color: "#1e3a5f",
              fillColor: "#3b82f6",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        ) : null}

        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>

      <div className="flex flex-wrap gap-3 border-t border-nurture-sage/10 px-4 py-2 text-xs text-nurture-charcoal/65">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-nurture-sage" /> Active
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Expanding
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-nurture-charcoal/40" /> Waitlist
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-nurture-sage/40 bg-nurture-sage/10" />{" "}
          County overlay
        </span>
      </div>
    </div>
  );
};

export default LeafletCoverageMap;
