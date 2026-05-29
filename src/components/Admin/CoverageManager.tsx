"use client";

import { coverageStatusLabels } from "@/content/site";
import {
  fetchAdminCoverage,
  reverseGeocodeCoveragePoint,
  saveAdminCoverage,
} from "@/lib/api/coverageClient";
import { DEFAULT_COVERAGE_CONFIG } from "@/lib/coverage/defaults";
import type {
  CoverageConfig,
  CoverageRegionConfig,
  CoverageStatus,
} from "@/types/coverage";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const LeafletCoverageMap = dynamic(
  () => import("@/components/Admin/LeafletCoverageMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 text-sm text-nurture-charcoal/60">
        Loading interactive map…
      </div>
    ),
  }
);

const emptyRegion = (): CoverageRegionConfig => ({
  id: `region-${crypto.randomUUID().slice(0, 8)}`,
  name: "New region",
  status: "expanding",
  services: "Birth doula, postpartum care, lactation support",
  zipPrefixes: [],
  center: { lat: 40.85, lng: -74.2 },
  radiusMiles: 25,
  coverageRatio: 25,
});

const CoverageManager = () => {
  const [config, setConfig] = useState<CoverageConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clickMarker, setClickMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [zipSuggestion, setZipSuggestion] = useState<{
    zip: string;
    prefix: string;
    label: string;
  } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchAdminCoverage();
      setConfig(result.config);
      setSelectedId(result.config.regions[0]?.id ?? null);
      setUsingDefaults(!result.usingSavedConfig);
      setLoadError(result.storageWarning ?? null);
      if (result.storageWarning) {
        toast(result.storageWarning, { icon: "⚠️" });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load coverage";
      setLoadError(message);
      setConfig({ ...DEFAULT_COVERAGE_CONFIG });
      setSelectedId(DEFAULT_COVERAGE_CONFIG.regions[0]?.id ?? null);
      setUsingDefaults(true);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = config?.regions.find((region) => region.id === selectedId) ?? null;

  const updateRegion = (id: string, patch: Partial<CoverageRegionConfig>) => {
    setConfig((current) =>
      !current
        ? current
        : {
            ...current,
            regions: current.regions.map((region) =>
              region.id === id ? { ...region, ...patch } : region
            ),
          }
    );
  };

  const handleMapClick = async (point: { lat: number; lng: number }) => {
    setClickMarker(point);
    if (selectedId) {
      updateRegion(selectedId, { center: point });
    }

    setGeocoding(true);
    setZipSuggestion(null);
    try {
      const result = await reverseGeocodeCoveragePoint(point.lat, point.lng);
      setZipSuggestion(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not suggest ZIP for this point"
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleAddZipPrefix = (prefix: string) => {
    if (!selected) return;
    if (selected.zipPrefixes.includes(prefix)) {
      toast.success(`ZIP prefix ${prefix} is already in ${selected.name}`);
      return;
    }
    updateRegion(selected.id, {
      zipPrefixes: [...selected.zipPrefixes, prefix].sort(),
    });
    toast.success(`Added ZIP prefix ${prefix} to ${selected.name}`);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const saved = await saveAdminCoverage(config);
      setConfig(saved);
      setLoadError(null);
      setUsingDefaults(false);
      toast.success("Coverage map saved — concierge will use this immediately");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRegion = () => {
    const region = emptyRegion();
    setConfig((current) =>
      current ? { ...current, regions: [...current.regions, region] } : current
    );
    setSelectedId(region.id);
  };

  const handleRemoveRegion = (id: string) => {
    if (!config || config.regions.length <= 1) return;
    setConfig({
      ...config,
      regions: config.regions.filter((region) => region.id !== id),
    });
    if (selectedId === id) {
      setSelectedId(config.regions.find((region) => region.id !== id)?.id ?? null);
    }
  };

  if (loading) {
    return <p className="text-sm text-nurture-charcoal/60">Loading coverage map…</p>;
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-900">
        <p className="font-medium">{loadError ?? "Could not load coverage map"}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {loadError ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            {usingDefaults
              ? "Using default regions — saved coverage could not be loaded from storage."
              : "Coverage loaded with warnings."}
          </p>
          <p className="mt-1 text-amber-900/80">{loadError}</p>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Coverage map
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-nurture-charcoal/65">
            Zoom and pan the map, click to place a region center, and auto-suggest ZIP
            prefixes from map clicks. The AI concierge reads this live during intake.
          </p>
          {config.updatedAt ? (
            <p className="mt-2 text-xs text-nurture-charcoal/45">
              Last saved {new Date(config.updatedAt).toLocaleString()}
              {config.updatedBy ? ` · ${config.updatedBy}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save coverage"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
          Public intro (shown on For Moms + concierge)
        </label>
        <textarea
          rows={2}
          value={config.intro}
          onChange={(event) =>
            setConfig({ ...config, intro: event.target.value })
          }
          className="mt-2 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <LeafletCoverageMap
            regions={config.regions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMapClick={handleMapClick}
            clickMarker={clickMarker}
          />

          {geocoding ? (
            <p className="text-xs text-nurture-charcoal/55">Looking up ZIP for click…</p>
          ) : zipSuggestion ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-nurture-charcoal">
              <p className="font-medium">{zipSuggestion.label}</p>
              <p className="mt-1 text-xs text-nurture-charcoal/65">
                Suggested 3-digit prefix:{" "}
                <span className="font-mono font-semibold">{zipSuggestion.prefix}</span>
              </p>
              {selected ? (
                <button
                  type="button"
                  onClick={() => handleAddZipPrefix(zipSuggestion.prefix)}
                  className="mt-3 rounded-full bg-nurture-sage px-4 py-1.5 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
                >
                  Add {zipSuggestion.prefix} to {selected.name}
                </button>
              ) : (
                <p className="mt-2 text-xs text-nurture-charcoal/55">
                  Select a region to add this ZIP prefix.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.regions.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setSelectedId(region.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedId === region.id
                    ? "bg-nurture-sage text-white"
                    : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
                }`}
              >
                {region.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddRegion}
              className="rounded-full border border-dashed border-nurture-sage/40 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark"
            >
              + Add region
            </button>
          </div>

          {selected ? (
            <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-nurture-charcoal">
                  Edit region
                </p>
                {selected.id !== "national-waitlist" ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveRegion(selected.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                <Field label="Name">
                  <input
                    value={selected.name}
                    onChange={(event) =>
                      updateRegion(selected.id, { name: event.target.value })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={selected.status}
                    onChange={(event) =>
                      updateRegion(selected.id, {
                        status: event.target.value as CoverageStatus,
                      })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                  >
                    {(Object.keys(coverageStatusLabels) as CoverageStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {coverageStatusLabels[status]}
                        </option>
                      )
                    )}
                  </select>
                </Field>
                <Field label={`Coverage ratio — ${selected.coverageRatio}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={selected.coverageRatio}
                    onChange={(event) =>
                      updateRegion(selected.id, {
                        coverageRatio: Number(event.target.value),
                      })
                    }
                    className="w-full accent-nurture-sage"
                  />
                </Field>
                <Field label="ZIP prefixes (comma-separated, e.g. 076, 070)">
                  <input
                    value={selected.zipPrefixes.join(", ")}
                    onChange={(event) =>
                      updateRegion(selected.id, {
                        zipPrefixes: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                  />
                </Field>
                <Field label="Radius (miles)">
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={selected.radiusMiles}
                    onChange={(event) =>
                      updateRegion(selected.id, {
                        radiusMiles: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                  />
                </Field>
                <Field label="Services offered">
                  <textarea
                    rows={2}
                    value={selected.services}
                    onChange={(event) =>
                      updateRegion(selected.id, { services: event.target.value })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                  />
                </Field>
                <Field label="Concierge note (optional)">
                  <textarea
                    rows={2}
                    value={selected.conciergeNote ?? ""}
                    onChange={(event) =>
                      updateRegion(selected.id, {
                        conciergeNote: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                    placeholder="How the concierge should talk about this region…"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Center lat">
                    <input
                      type="number"
                      step="0.001"
                      value={selected.center.lat}
                      onChange={(event) =>
                        updateRegion(selected.id, {
                          center: {
                            ...selected.center,
                            lat: Number(event.target.value),
                          },
                        })
                      }
                      className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                    />
                  </Field>
                  <Field label="Center lng">
                    <input
                      type="number"
                      step="0.001"
                      value={selected.center.lng}
                      onChange={(event) =>
                        updateRegion(selected.id, {
                          center: {
                            ...selected.center,
                            lng: Number(event.target.value),
                          },
                        })
                      }
                      className="w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-xs font-medium text-nurture-charcoal/60">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

export default CoverageManager;
