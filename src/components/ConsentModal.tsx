import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  HeartPulse,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  Building2,
} from 'lucide-react';
import { Hospital, PatientProfile, Vitals } from '../types.js';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hospital: Hospital;
  patient: PatientProfile;
  vitals: Vitals;
  mainComplaint: string;
  isSubmitting: boolean;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  hospital,
  patient,
  vitals,
  mainComplaint,
  isSubmitting,
}) => {
  const [agreed, setAgreed] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-cyan-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Emergency Coordination & Data Transmission Consent
              </h3>
              <p className="text-xs text-slate-400">
                Minimum-necessary emergency data transmission to selected verified hospital.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Selected Hospital Highlight */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Selected Hospital</span>
                <h4 className="text-sm font-extrabold text-white">{hospital.name}</h4>
                <p className="text-xs text-slate-400">{hospital.city}, {hospital.stateRegion} ({hospital.address})</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Travel Time</span>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                {hospital.etaMinutes ?? 8} min
              </div>
            </div>
          </div>

          {/* Minimal Necessary Clinical Data to be Shared */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data Package Authorized for Transmission (Zero Extraneous Data)</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Patient Identity</span>
                <strong className="text-white">{patient.name}, {patient.age}y ({patient.gender})</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Primary Emergency</span>
                <strong className="text-rose-400">{mainComplaint}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Hemodynamics</span>
                <strong className="text-white font-mono">HR {vitals.heartRate} | SpO₂ {vitals.spO2}% | BP {vitals.bloodPressure}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Blood Group</span>
                <strong className="text-white">{patient.bloodGroup}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Known Critical Allergies</span>
                <strong className="text-amber-400">{patient.allergies.join(', ') || 'None recorded'}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">GPS Origin & Route</span>
                <strong className="text-cyan-400 font-mono">Target Anand Corridor</strong>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start space-x-3">
            <input
              type="checkbox"
              id="consent-check"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 border-slate-700 bg-slate-900"
            />
            <label htmlFor="consent-check" className="text-xs text-slate-200 leading-relaxed cursor-pointer select-none">
              <strong>Patient Emergency Authorization:</strong> “I authorize PRAANJEEV to securely share my emergency information and real-time vitals with <strong>{hospital.name}</strong> for emergency triage, advance bed preparation, and resource allocation before arrival.”
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel / Back to Selection
          </button>
          <button
            type="button"
            disabled={!agreed || isSubmitting}
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/60 transition disabled:opacity-40 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <span>Transmitting Case to Hospital...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Transmit Emergency Case</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
