import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Building2,
  Clock,
  Route,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Zap,
  ArrowRight,
  HeartPulse,
  Share2,
} from 'lucide-react';
import { EmergencyCase, CaseStatus } from '../types.js';
import { RouteMap } from './RouteMap.js';

interface ActiveEmergencyTrackerProps {
  emergencyCase: EmergencyCase;
  onDynamicReroute: (caseId: string) => void;
  onUpdateStatus: (caseId: string, newStatus: CaseStatus) => void;
  isRerouting: boolean;
}

const TIMELINE_STAGES: { status: CaseStatus; label: string; desc: string }[] = [
  { status: 'AI_ASSESSED', label: 'AI Assessed', desc: 'Critical triage calculated' },
  { status: 'HOSPITAL_SELECTED', label: 'Hospital Picked', desc: 'Patient consent given' },
  { status: 'HOSPITAL_NOTIFIED', label: 'Hospital Notified', desc: 'Data transmitted' },
  { status: 'ACCEPTED', label: 'Case Accepted', desc: 'Triage team confirmed' },
  { status: 'PREPARING', label: 'Preparing Resources', desc: 'ICU & Cath Lab mobilizing' },
  { status: 'AMBULANCE_EN_ROUTE', label: 'Ambulance En Route', desc: 'Green corridor active' },
  { status: 'ARRIVING_SOON', label: 'Arriving Soon', desc: 'ER Bay cleared' },
  { status: 'PATIENT_ARRIVED', label: 'Patient Arrived', desc: 'Immediate trauma handover' },
];

export const ActiveEmergencyTracker: React.FC<ActiveEmergencyTrackerProps> = ({
  emergencyCase,
  onDynamicReroute,
  onUpdateStatus,
  isRerouting,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    emergencyCase.route?.selectedRouteId || 'route-c'
  );

  const currentStageIndex = TIMELINE_STAGES.findIndex((s) => s.status === emergencyCase.status);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 2;

  return (
    <div className="space-y-6">
      {/* Top Critical Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                Live Active Emergency Case
              </span>
              <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2.5 py-0.5 rounded-full border border-slate-700">
                {emergencyCase.id}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {emergencyCase.patientName} ({emergencyCase.patientAge}y, {emergencyCase.patientGender}) —{' '}
              <span className="text-rose-400">{emergencyCase.severity} TRIAGE</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300">
              Coordinating dispatch to <strong className="text-cyan-400">{emergencyCase.selectedHospitalName}</strong>
            </p>
          </div>

          {/* Rapid Simulation Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dynamic Reroute Button */}
            <button
              onClick={() => onDynamicReroute(emergencyCase.id)}
              disabled={isRerouting || emergencyCase.route?.liveRerouted}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition ${
                emergencyCase.route?.liveRerouted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-950/40'
              }`}
              title="Detect traffic congestion and switch to dynamic bypass route"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>
                {emergencyCase.route?.liveRerouted
                  ? 'Dynamic Detour Active (ETA 7 min)'
                  : isRerouting
                  ? 'Recalculating Fastest Route...'
                  : 'Simulate Traffic & Live Reroute'}
              </span>
            </button>

            {/* Advance Case Timeline Simulator for Demo */}
            {activeIndex < TIMELINE_STAGES.length - 1 && (
              <button
                onClick={() => {
                  const nextStatus = TIMELINE_STAGES[activeIndex + 1].status;
                  onUpdateStatus(emergencyCase.id, nextStatus);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              >
                <span>Advance Next Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Reroute Alert Notification Banner if active */}
        {emergencyCase.route?.rerouteNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 text-xs flex items-center space-x-2 shadow-inner">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{emergencyCase.route.rerouteNotice}</span>
          </div>
        )}
      </div>

      {/* 8-Stage Visual Emergency Timeline Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Real-time Multi-Stage Coordination Pipeline</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={stage.status}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/30'
                    : isCompleted
                    ? 'bg-slate-950/80 border-emerald-800/60'
                    : 'bg-slate-950/40 border-slate-800 opacity-50'
                }`}
              >
                <div className="flex justify-center mb-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950 animate-pulse font-mono">
                      {idx + 1}
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <h4 className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  {stage.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrated Live Route Map & Traffic Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>Integrated Traffic-Aware Ambulance Route</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Live ETA: <strong className="text-emerald-400">{emergencyCase.route?.etaMinutes ?? 8} min</strong>
            </span>
          </div>

          <RouteMap
            originLat={emergencyCase.patientLocation.lat}
            originLng={emergencyCase.patientLocation.lng}
            destLat={22.5830}
            destLng={72.9520}
            hospitalName={emergencyCase.selectedHospitalName || 'Hospital B (Zydus Super-Speciality)'}
            routes={emergencyCase.route?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            isLiveRerouted={emergencyCase.route?.liveRerouted}
          />

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Origin: <strong>{emergencyCase.patientLocation.city} ({emergencyCase.patientLocation.area})</strong></span>
            <span>Target Destination: <strong className="text-cyan-300">{emergencyCase.selectedHospitalName}</strong></span>
          </div>
        </div>

        {/* Right Col: Advance Hospital Preparation Checklist */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Advance Hospital Preparation</span>
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Hospital Mobilized
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Resources mobilized by hospital triage team ahead of ambulance arrival:
            </p>

            <div className="space-y-2">
              {emergencyCase.preparationChecklist.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'READY'
                          ? 'bg-emerald-400'
                          : item.status === 'PREPARING'
                          ? 'bg-cyan-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-slate-200 font-medium">{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                      item.status === 'READY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : item.status === 'PREPARING'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Emergency Contacts Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Direct Emergency Dispatch Line
            </h4>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Hospital Hotline:</span>
              <strong className="text-white font-mono">+91 2692 245911</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Ambulance Unit:</span>
              <strong className="text-cyan-300 font-mono">Unit 04 (Telemetry Sync)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
