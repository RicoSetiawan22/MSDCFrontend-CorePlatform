import React, { useState, useMemo } from "react";
import {
  MapPin,
  ExternalLink,
  Navigation,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import type { Site } from "../../types/site";

export interface SiteLocationMapProps {
  site: Site;
}

const KNOWN_SITE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "DC-SBY-01": { lat: -7.31956, lng: 112.73504 },
  "DC-JKT-01": { lat: -6.20876, lng: 106.8456 },
  "DC-BDG-01": { lat: -6.91746, lng: 107.61912 },
  "Surabaya": { lat: -7.25747, lng: 112.75209 },
  "Jakarta": { lat: -6.20876, lng: 106.8456 },
  "Bandung": { lat: -6.91746, lng: 107.61912 },
  "Semarang": { lat: -6.96667, lng: 110.41666 },
};

export const SiteLocationMap: React.FC<SiteLocationMapProps> = ({ site }) => {
  const [copied, setCopied] = useState(false);

  // ── 1. Format Alamat & URL Google Maps ──
  const fullAddress = useMemo(() => {
    if (site.address) return site.address;
    const parts = [site.city, site.province].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : site.site_name;
  }, [site.address, site.city, site.province, site.site_name]);

  const queryAddress = useMemo(() => {
    return `${site.site_name}, ${fullAddress}`;
  }, [site.site_name, fullAddress]);

  const embedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(queryAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [queryAddress]);

  const mapsSearchUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryAddress)}`;
  }, [queryAddress]);

  const mapsDirectionsUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(queryAddress)}`;
  }, [queryAddress]);

  // ── 2. Dapatkan Koordinat GPS Presisi ──
  const coordinates = useMemo(() => {
    if (site.site_code && KNOWN_SITE_COORDINATES[site.site_code]) {
      return KNOWN_SITE_COORDINATES[site.site_code];
    }
    if (site.city && KNOWN_SITE_COORDINATES[site.city]) {
      return KNOWN_SITE_COORDINATES[site.city];
    }
    return KNOWN_SITE_COORDINATES["Surabaya"];
  }, [site.site_code, site.city]);

  const coordinateString = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;

  const handleCopyCoordinates = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(coordinateString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200/90 flex flex-col gap-4 h-full justify-between">
      {/* ── Header Lokasi ── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
            <Compass size={15} />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Lokasi & Navigasi Fasilitas
          </span>
        </div>

        {/* Badge Koordinat GPS dengan tombol salin */}
        <button
          type="button"
          onClick={handleCopyCoordinates}
          title="Klik untuk menyalin koordinat"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-300 text-[11px] font-mono font-bold text-slate-700 hover:text-amber-700 transition-all cursor-pointer shadow-2xs group"
        >
          <MapPin size={11} className="text-amber-500 group-hover:scale-110 transition-transform" />
          <span>{coordinateString}</span>
          {copied ? (
            <Check size={11} className="text-emerald-600" />
          ) : (
            <Copy size={11} className="text-slate-400 group-hover:text-slate-600" />
          )}
        </button>
      </div>

      {/* ── Native Interactive Google Maps Iframe ── */}
      <div className="relative w-full h-52 sm:h-56 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 group">
        <iframe
          title={`Peta Lokasi ${site.site_name}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* ── Informasi Alamat Singkat ── */}
      <div className="flex items-start gap-2 text-xs text-slate-700 bg-white/70 p-3 rounded-lg border border-slate-200/60">
        <MapPin size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900">{site.site_name}</span>
          <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {fullAddress}
          </span>
        </div>
      </div>

      {/* ── Tombol Direct Navigasi ke Browser ── */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-2xs hover:shadow-xs active:scale-95 text-center"
        >
          <ExternalLink size={13} className="text-slate-500" />
          <span>Buka di Maps</span>
        </a>

        <a
          href={mapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#C28100] text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 text-center"
        >
          <Navigation size={13} />
          <span>Petunjuk Arah</span>
        </a>
      </div>
    </div>
  );
};

export default SiteLocationMap;
