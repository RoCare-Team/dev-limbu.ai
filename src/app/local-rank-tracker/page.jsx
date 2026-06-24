"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Circle,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useRankTracker } from "@/hooks/useRankTracker";
import { useKeywordPlanner } from "@/hooks/useKeywordPlanner";
import {
  Search,
  MapPin,
  Trophy,
  LayoutGrid,
  Sparkles,
  Loader2,
  Building2,
  Globe,
  ChevronDown,
  Store,
  Map as MapIcon,
} from "lucide-react";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "80vh",
  borderRadius: "24px",
};
const RADIUS_METERS = 1400;
const LIBRARIES = ["places"];

// Enhanced Visuals Logic
function getRankVisuals(rank) {
  // Rank 1: Dominant (Emerald/Green)
  if (rank === 1)
    return {
      color: "#10b981",
      bg: "bg-emerald-500",
      light: "#ecfdf5",
      border: "#059669",
    };
  // Rank 2-3: Competitive (Amber/Yellow)
  if (rank <= 3 && rank > 0)
    return {
      color: "#f59e0b",
      bg: "bg-amber-500",
      light: "#fffbeb",
      border: "#d97706",
    };
  // Rank 4+: Weak (Rose/Red)
  return {
    color: "#f43f5e",
    bg: "bg-rose-500",
    light: "#fff1f2",
    border: "#e11d48",
  };
}

const PIN_PATH =
  "M12 0C7.03 0 3 4.03 3 9c0 6.25 7.25 14.5 8.18 15.51a1.1 1.1 0 0 0 1.64 0C13.75 23.5 21 15.25 21 9c0-4.97-4.03-9-9-9z";

export default function RankTrackerPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const {
    gridPoints: rawGridPoints,
    centerPoint,
    summary,
    isLoading,
    fetchRanks,
  } = useRankTracker();
  const { suggestions, isSearching, searchKeywords } = useKeywordPlanner();

  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [activePoint, setActivePoint] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const [gridSize, setGridSize] = useState("5x5");

  const mapRef = useRef(null);
  const suggestionRef = useRef(null);

  // Take only top points for the demo grid
  const gridPoints = useMemo(() => rawGridPoints, [rawGridPoints]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        setLocations(dataArray);
        if (dataArray.length > 0) {
          const first = dataArray[0];
          setSelectedLocId(first.locationId);
          setBusinessName(first.title || "");
          setCity(first.locality || "");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLocationChange = (id) => {
    const found = locations.find((l) => l.locationId === id);
    if (found) {
      setSelectedLocId(id);
      setBusinessName(found.title || "");
      setCity(found.locality || "");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length > 2 && showSuggestions) searchKeywords(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, searchKeywords, showSuggestions]);

  const mapCenter = useMemo(() => {
    if (centerPoint) return { lat: centerPoint.lat, lng: centerPoint.lng };
    return { lat: 28.4595, lng: 77.0266 };
  }, [centerPoint]);

  const fitToGrid = (points) => {
    if (!mapRef.current || !window.google || points.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    mapRef.current.fitBounds(bounds, 80);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setActivePoint(null);

    await fetchRanks({
      keyword,
      city,
      businessName,
      gridSize,
    });
  };

  const makeIcon = (color, big) => {
    if (!isLoaded || !window.google) return undefined;
    return {
      path: PIN_PATH,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: big ? 1.6 : 1.3,
      anchor: new window.google.maps.Point(12, 24),
      labelOrigin: new window.google.maps.Point(12, 9),
    };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-2xl shadow-lg shadow-yellow-100">
              <MapPin className="text-white" size={28} strokeWidth={3} />
            </div>
            <span>
              Local <span className="text-yellow-500">Rank</span> Tracker
            </span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Hyper-local visibility audit for Google Maps.
          </p>
        </div>

        {summary.totalPoints > 0 && (
          <div className="flex gap-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-4 px-6 shadow-xl shadow-slate-100 flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Coverage
                </p>
                <p className="text-xl font-black text-slate-800">
                  {summary.rankedPoints}/{summary.totalPoints}
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl p-4 px-6 shadow-xl shadow-slate-100 flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Top Rank
                </p>
                <p className="text-xl font-black text-slate-800">
                  #{summary.bestRank || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Selector */}
      {locations.length > 1 && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-200 rounded-[28px] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-4 bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-yellow-400 shadow-inner">
                <Store size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Active Profile
                </p>
                <p className="text-sm font-bold text-slate-700">
                  Multi-location Managed
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-100 hidden md:block" />
            <div className="relative w-full">
              <select
                value={selectedLocId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold py-3.5 px-5 pr-12 rounded-2xl cursor-pointer hover:border-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-50 transition-all text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.title} • {loc.locality}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                size={20}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4"
          style={{
            gridTemplateColumns: "1fr 100px 1fr 1fr 180px",
          }}
        >
          <div className="space-y-2 relative" ref={suggestionRef}>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Keyword
            </label>
            <div className="relative">
              <input
                value={keyword}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold focus:border-yellow-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-50 transition-all"
                placeholder="Dentist near me"
              />
              {isSearching && (
                <Loader2
                  className="absolute right-4 top-4 animate-spin text-yellow-500"
                  size={20}
                />
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-slate-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setKeyword(s.keyword);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm hover:bg-yellow-50 rounded-xl transition-colors mb-1 group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles
                        size={16}
                        className="text-yellow-400 group-hover:scale-110 transition-transform"
                      />
                      <span className="font-bold text-slate-700">
                        {s.keyword}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-tighter">
                      {s.volume.toLocaleString()} searches
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 w-[100px]">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Grid Size
            </label>

            <select
              value={gridSize}
              onChange={(e) => setGridSize(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold"
            >
              <option value="1x1">1 × 1</option>
              <option value="3x3">3 × 3</option>
              <option value="5x5">5 × 5</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              City
            </label>
            <div className="relative">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold focus:border-yellow-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-50 transition-all"
              />
              <Globe
                className="absolute right-4 top-4 text-slate-300"
                size={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Business
            </label>
            <div className="relative">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold focus:border-yellow-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-50 transition-all"
              />
              <Building2
                className="absolute right-4 top-4 text-slate-300"
                size={20}
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !keyword}
              className="w-full h-[54px] rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-black hover:shadow-2xl hover:shadow-slate-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Search size={20} strokeWidth={3} /> GENERATE AUDIT
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Map Section */}
      <div className="relative overflow-hidden rounded-[40px] border-[12px] border-white shadow-2xl bg-slate-50">
        {!isLoaded ? (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-yellow-500" size={48} />
              <p className="text-slate-400 font-bold animate-pulse">
                Initializing Map Engine...
              </p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={mapCenter}
            zoom={13}
            onLoad={(map) => {
              mapRef.current = map;
              if (gridPoints.length > 0) fitToGrid(gridPoints);
            }}
            options={{
              styles: mapStyles,
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {gridPoints.map((point) => {
              const visual = getRankVisuals(point.businessRank);
              const isPointHovered = hoveredId === point.id;
              const isPointActive = activePoint?.id === point.id;

              return (
                <div key={point.id}>
                  {/* Modern Glassmorphism Circle */}
                  <Circle
                    center={{ lat: point.lat, lng: point.lng }}
                    radius={RADIUS_METERS}
                    onClick={() => setActivePoint(point)}
                    options={{
                      strokeColor: visual.color,
                      strokeOpacity:
                        isPointHovered || isPointActive ? 0.8 : 0.3,
                      strokeWeight: isPointHovered || isPointActive ? 2 : 1,
                      fillColor: visual.color,
                      fillOpacity: isPointHovered ? 0.25 : 0.12, // Very light transparent fill
                      zIndex: isPointHovered ? 10 : 1,
                    }}
                  />
                  <Marker
                    position={{ lat: point.lat, lng: point.lng }}
                    onClick={() => setActivePoint(point)}
                    onMouseOver={() => setHoveredId(point.id)}
                    onMouseOut={() => setHoveredId(null)}
                    label={{
                      text: point.businessRank ? `${point.businessRank}` : "—",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                    icon={makeIcon(
                      visual.color,
                      point.isCenter || isPointHovered,
                    )}
                  />
                </div>
              );
            })}

            {activePoint && (
              <InfoWindow
                position={{ lat: activePoint.lat, lng: activePoint.lng }}
                onCloseClick={() => setActivePoint(null)}
              >
                <div className="min-w-[280px] p-2 bg-white">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Audit Result
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Lat: {activePoint.lat.toFixed(4)} Lng:{" "}
                        {activePoint.lng.toFixed(4)}
                      </p>
                    </div>
                    {activePoint.businessFound ? (
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black ring-1 ring-emerald-100">
                        Rank #{activePoint.businessRank}
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-black ring-1 ring-rose-100">
                        Unranked
                      </div>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {activePoint.competitors.map((c) => {
                      const isMe =
                        c.name?.toLowerCase().trim() ===
                        businessName.toLowerCase().trim();
                      return (
                        <div
                          key={c.rank}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${isMe ? "border-emerald-200 bg-emerald-50/50" : "border-slate-50 bg-slate-50/50"}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-black text-slate-800 line-clamp-1">
                              <span className="text-slate-400 mr-1">
                                #{c.rank}
                              </span>{" "}
                              {c.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-amber-500">
                                ★ {c.rating}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {c.reviews} reviews
                              </span>
                            </div>
                          </div>
                          <MapIcon
                            size={14}
                            className={
                              isMe ? "text-emerald-500" : "text-slate-300"
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Legend & Footer */}
      <div className="flex flex-wrap items-center justify-center gap-10 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white/50 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-sm" />
          <span className="text-[12px] font-black text-slate-600 uppercase tracking-wider">
            Dominant (#1)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full bg-amber-400 ring-4 ring-amber-50 shadow-sm" />
          <span className="text-[12px] font-black text-slate-600 uppercase tracking-wider">
            Competitive (#2-3)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full bg-rose-500 ring-4 ring-rose-100 shadow-sm" />
          <span className="text-[12px] font-black text-slate-600 uppercase tracking-wider">
            Weak Visibility
          </span>
        </div>
      </div>
    </div>
  );
}

// Clean, Desaturated Map Style for Data Focus
const mapStyles = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#f8fafc" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e2e8f0" }, { weight: 1 }],
  },
];
