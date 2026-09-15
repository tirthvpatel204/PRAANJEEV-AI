import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Navigation,
  HeartPulse,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { Hospital } from '../types.js';

interface HospitalRankingListProps {
  hospitals: Hospital[];
  onSelectHospital: (hospital: Hospital) => void;
  selectedHospitalId?: string;
}

export const HospitalRankingList: React.FC<HospitalRankingListProps> = ({
  hospitals,
  onSelectHospital,
  selectedHospitalId,
}) => {
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedHospitalId(expandedHospitalId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>AI-Ranked Verified Hospitals (Location & Resource Matched)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Multi-factor evaluation: Patient Emergency Condition + Clinical Capabilities + Live ICU/O₂ Availability + Verification Trust + Route ETA.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto font-mono">
          {hospitals.length} Area Centers Evaluated
        </span>
      </div>

      <div className="space-y-3.5">
        {hospitals.map((hospital, index) => {
          const isTopRanked = index === 0 && hospital.score && hospital.score > 60;
          const isSuspended = hospital.verificationStatus === 'SUSPENDED';
          const isOutdated = hospital.dataConfidence === 'LOW';
          const isExpanded = expandedHospitalId === hospital.id;

          return (
            <div
              key={hospital.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
                isTopRanked
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20'
                  : isSuspended
                  ? 'bg-slate-950/60 border-rose-900/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Bar for Recommended Badge */}
              {isTopRanked && (
                <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 px-4 py-1.5 flex items-center justify-between text-white text-xs font-extrabold tracking-wide">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>AI TOP RECOMMENDATION — FASTEST PRACTICAL ROUTE & COMPLETE CAPABILITY</span>
                  </div>
                  <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
                    Suitability Score: {hospital.score}/100
                  </span>
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Hospital Name, Verification & Location */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-extrabold text-white font-display">
                        {hospital.name}
                      </h4>

                      {/* Verification Status Badge */}
                      {hospital.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified Hospital</span>
                        </span>
                      ) : hospital.verificationStatus === 'SUSPENDED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>SUSPENDED (Non-Compliant)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pending Verification</span>
                        </span>
                      )}

                      {/* Data Freshness Indicator */}
                      {isOutdated ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/80 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>⚠️ Resource data outdated</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Fresh data (Verified)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 flex items-center space-x-1">
                      <Navigation className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{hospital.address}</span>
                    </p>
                  </div>

                  {/* Right: Route, Traffic & ETA Highlights */}
                  <div className="flex items-center space-x-3 sm:space-x-4 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl self-start lg:self-auto">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
                      <div className="text-sm font-extrabold text-white font-mono">
                        {hospital.distanceKm ?? 4.5} km
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Traffic</div>
                      <div className="text-xs font-bold font-mono">
                        {hospital.trafficStatus === 'HEAVY' ? (
                          <span className="text-rose-400 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Heavy</span>
                          </span>
                        ) : hospital.trafficStatus === 'MEDIUM' ? (
                          <span className="text-amber-400 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Medium</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Low</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Ambulance ETA</div>
                      <div className={`text-base font-extrabold font-mono ${
                        (hospital.etaMinutes ?? 15) <= 10 ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {hospital.etaMinutes ?? 12} min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Resource Indicators Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
                  {/* ICU Beds */}
                  <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                    hospital.resources.availableICU > 0
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}>
                    <span className="text-slate-400">ICU Capacity:</span>
                    <strong className="font-mono">
                      {hospital.resources.availableICU > 0 ? (
                        <span className="text-emerald-400">
                          {hospital.resources.availableICU} / {hospital.resources.totalICU} Avail
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">0 Avail (FULL)</span>
                      )}
                    </strong>
                  </div>

                  {/* Oxygen */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Oxygen:</span>
                    <strong className="font-mono text-cyan-300">
                      {hospital.resources.oxygenUnits} units ({hospital.resources.oxygenStatus})
                    </strong>
                  </div>

                  {/* Cardiac Team */}
                  <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                    hospital.resources.cardiacCareAvailable
                      ? 'bg-slate-950 border-slate-800 text-emerald-400'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  }`}>
                    <span>Cardiac Care:</span>
                    {hospital.resources.cardiacCareAvailable ? (
                      <span className="flex items-center space-x-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-slate-500">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>No Team</span>
                      </span>
                    )}
                  </div>

                  {/* Emergency Beds */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">ER Beds:</span>
                    <strong className="font-mono text-white">
                      {hospital.resources.emergencyBeds} Active
                    </strong>
                  </div>
                </div>

                {/* AI Transparent Explanation Box */}
                {hospital.matchReason && (
                  <div className={`p-3 rounded-xl border text-xs mb-4 ${
                    isTopRanked
                      ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
                      : hospital.resources.availableICU === 0
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5">AI Suitability Analysis:</strong>
                        <span>{hospital.matchReason}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => toggleExpand(hospital.id)}
                    className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1 transition font-medium"
                  >
                    <span>{isExpanded ? 'Hide Detailed Clinical Resources' : 'View Full Clinical & Staff Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isSuspended}
                      onClick={() => onSelectHospital(hospital)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition ${
                        isSuspended
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : isTopRanked
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-cyan-900/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>{selectedHospitalId === hospital.id ? 'Hospital Selected ✓' : 'Select Hospital & Authorize'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Detailed View */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                        On-Duty Emergency Staff
                      </h5>
                      <ul className="space-y-1 text-slate-300">
                        <li>Emergency Doctors on Duty: <strong className="text-white font-mono">{hospital.resources.emergencyDoctorsOnDuty}</strong></li>
                        <li>Active Ambulances: <strong className="text-white font-mono">{hospital.resources.ambulancesAvailable}</strong></li>
                        <li className="pt-1">
                          <span className="text-slate-400 block mb-1">On-Duty Specialists:</span>
                          <div className="flex flex-wrap gap-1">
                            {hospital.resources.specialistsAvailable.map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-900 text-cyan-300 rounded text-[10px] border border-slate-800">
                                {s}
                              </span>
                            ))}
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Accreditation & Compliance
                      </h5>
                      <ul className="space-y-1 text-slate-300">
                        <li>Reg No: <span className="text-white font-mono">{hospital.registrationNumber}</span></li>
                        <li>License: <span className="text-white font-mono">{hospital.licenseNumber}</span></li>
                        <li>Accreditation: <span className="text-emerald-400 font-semibold">{hospital.accreditation}</span></li>
                        <li>Authorized Lead: <span className="text-white">{hospital.authorizedPerson.name} ({hospital.authorizedPerson.designation})</span></li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Hourly Freshness Audit
                      </h5>
                      <ul className="space-y-1 text-slate-300">
                        <li>Last Updated: <span className="text-white font-mono">{new Date(hospital.lastResourceUpdate).toLocaleTimeString()}</span></li>
                        <li>Next Update Due: <span className="text-white font-mono">{new Date(hospital.nextUpdateDue).toLocaleTimeString()}</span></li>
                        <li>Confidence Rating: <span className={`font-bold ${isOutdated ? 'text-amber-400' : 'text-emerald-400'}`}>{hospital.dataConfidence}</span></li>
                        <li>24×7 Emergency: <span className="text-emerald-400 font-bold">{hospital.is24x7 ? 'YES' : 'NO'}</span></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
