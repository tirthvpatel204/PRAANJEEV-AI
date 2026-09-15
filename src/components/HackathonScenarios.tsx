import React from 'react';
import {
  Zap,
  ShieldCheck,
  Building2,
  HeartPulse,
  Route,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { LocationPreset } from '../types.js';

interface HackathonScenariosProps {
  onRunScenario1: () => void;
  onRunScenario2: () => void;
  onRunScenario3: (loc: LocationPreset) => void;
  locations: LocationPreset[];
}

export const HackathonScenarios: React.FC<HackathonScenariosProps> = ({
  onRunScenario1,
  onRunScenario2,
  onRunScenario3,
  locations,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-800/80 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Interactive Hackathon Demo Matrix</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white font-display">
          Judges & Evaluators Rapid Demonstration Suite
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl mt-1">
          Execute end-to-end emergency workflows in a single click. Test live AI assessment, transparent hospital ranking, anti-fake data protection, and dynamic traffic detour.
        </p>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Scenario 1: The Anand Cardiac Emergency (The Core USP) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Primary Pitch Demo
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <h3 className="text-base font-extrabold text-white">
                Anand 45yo Severe Cardiac Emergency Flow
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Demonstrates why the closest hospital isn’t always the right hospital:
            </p>

            <ul className="space-y-2 text-xs text-slate-300 mb-5">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Patient:</strong> Rajesh Patel (45y), Anand, Gujarat. Vitals: HR 118 bpm, SpO₂ 89%, BP 90/60 mmHg (Critical ACS).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Hospital A (City Emergency):</strong> Only 3.2 km away, but has <strong>0 ICU beds</strong> and <strong>heavy traffic (17 min)</strong>. AI rejects as top match.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Hospital B (Zydus Super-Speciality):</strong> 5.1 km away, has <strong>12 ICU beds, Oxygen, Cath Lab</strong>, and <strong>8 min travel time</strong>. AI ranks as #1 match.
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={onRunScenario1}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg transition"
          >
            <span>Launch Complete Scenario 1 Flow</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario 2: Anti-Fake Data & Freshness Protection */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-amber-800/60 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <h3 className="text-base font-extrabold text-white">
                Anti-Fake Data Protection & Freshness Anomaly
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Demonstrates PRAANJEEV’s strict hospital integrity validation rules:
            </p>

            <ul className="space-y-2 text-xs text-slate-300 mb-5">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Capacity Anomaly:</strong> If hospital inputs Available ICU = 35 when Total = 20, the system blocks the update with a 400 error and logs an anomaly.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Hourly Freshness Decay:</strong> Anand Metro Hospital has not updated resources for 5 hours. System flags as <em>LOW confidence</em> and penalizes ranking.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Suspension Gate:</strong> Apex Medicare is marked SUSPENDED and cannot be selected for emergency dispatch.
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={onRunScenario2}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg transition"
          >
            <span>Test Anti-Fake Data & Anomaly Handling</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario 3: Global Location Intelligence */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-800/60 shadow-xl flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-extrabold text-white">
                Multi-City & International Location Scoping (Zero Data Leakage)
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              PRAANJEEV automatically scopes hospitals and routing exclusively to the patient’s active jurisdiction. Selecting London will never display Anand hospitals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              {locations.map((loc) => (
                <button
                  key={loc.city}
                  onClick={() => onRunScenario3(loc)}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-cyan-400">
                    {loc.city}, {loc.country}
                  </div>
                  <div className="text-[10px] text-slate-400">{loc.area}</div>
                  <div className="text-[10px] text-indigo-400 mt-1 font-mono">
                    Lat: {loc.lat.toFixed(2)}, Lng: {loc.lng.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
