import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Building2,
  MapPin,
  AlertTriangle,
  Zap,
  CheckCircle2,
  UserCheck,
  Compass,
} from 'lucide-react';
import { LocationPreset, PatientProfile } from '../types.js';

interface HeaderProps {
  currentLocation: LocationPreset;
  locations: LocationPreset[];
  onSelectLocation: (loc: LocationPreset) => void;
  activeTab: 'patient' | 'hospital' | 'admin' | 'scenarios';
  setActiveTab: (tab: 'patient' | 'hospital' | 'admin' | 'scenarios') => void;
  patient: PatientProfile;
  onDetectGPS: () => void;
  isDetectingGPS: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  locations,
  onSelectLocation,
  activeTab,
  setActiveTab,
  patient,
  onDetectGPS,
  isDetectingGPS,
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-xl">
      {/* Top emergency pulse bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-rose-500 to-indigo-500 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('patient')}>
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 via-red-500 to-amber-500 shadow-lg shadow-rose-900/40 text-white font-bold">
              <Activity className="w-7 h-7 text-white animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-tight text-white font-display">
                  PRAAN<span className="text-cyan-400">JEEV</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  AI Emergency Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium italic hidden sm:block">
                “In the race against time, we choose life.”
              </p>
            </div>
          </div>

          {/* Location Selector (GPS / Multi-City Intelligence) */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-semibold transition shadow-sm"
              title="Change active emergency search location"
            >
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="text-left hidden md:block">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Patient Area</div>
                <div className="font-semibold text-white">
                  {currentLocation.city}, {currentLocation.country}
                </div>
              </div>
              <span className="md:hidden font-semibold text-white">{currentLocation.city}</span>
              <Compass className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Location Dropdown */}
            {showLocationDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>Location Intelligence</span>
                  <span className="text-emerald-400 text-[10px]">Auto-Scoped</span>
                </div>

                <div className="p-1 space-y-1">
                  {locations.map((loc) => (
                    <button
                      key={`${loc.city}-${loc.country}`}
                      onClick={() => {
                        onSelectLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        currentLocation.city === loc.city
                          ? 'bg-cyan-950/70 text-cyan-200 border border-cyan-700/60 font-semibold'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{loc.city}, {loc.stateRegion}</div>
                        <div className="text-[10px] text-slate-400">{loc.country} ({loc.area})</div>
                      </div>
                      {currentLocation.city === loc.city && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onDetectGPS();
                      setShowLocationDropdown(false);
                    }}
                    disabled={isDetectingGPS}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold transition border border-indigo-800/50"
                  >
                    <MapPin className="w-3.5 h-3.5 animate-bounce" />
                    <span>{isDetectingGPS ? 'Acquiring GPS Fix...' : 'Detect Device GPS Location'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('patient')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'patient'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Emergency</span>
            </button>

            <button
              onClick={() => setActiveTab('hospital')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'hospital'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Hospital Center</span>
              <span className="md:hidden">Hospital</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Admin Audit</span>
              <span className="md:hidden">Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'scenarios'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/30'
                  : 'text-amber-400 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hackathon Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
