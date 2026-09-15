import React from 'react';
import {
  AlertTriangle,
  Cpu,
  HeartPulse,
  ShieldAlert,
  CheckCircle2,
  FileBadge,
  Sparkles,
  Info,
} from 'lucide-react';
import { EmergencySeverity } from '../types.js';

interface AIAssessmentViewProps {
  assessment: {
    severity: EmergencySeverity;
    severityScore: number;
    summary: string;
    riskIndicators: string[];
    requiredCapabilities: string[];
    preAlertMessage: string;
    disclaimer: string;
  };
}

export const AIAssessmentView: React.FC<AIAssessmentViewProps> = ({ assessment }) => {
  const getSeverityStyle = (sev: EmergencySeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/80',
          border: 'border-rose-600',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-400',
          ring: 'ring-rose-500/40',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-600',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-400',
          ring: 'ring-amber-500/40',
        };
      default:
        return {
          bg: 'bg-cyan-950/80',
          border: 'border-cyan-600',
          badge: 'bg-cyan-600 text-white',
          text: 'text-cyan-400',
          ring: 'ring-cyan-500/40',
        };
    }
  };

  const style = getSeverityStyle(assessment.severity);

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300`}>
      {/* Top Banner with AI Brand Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 shadow-inner">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                AI Emergency Assessment Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-mono">
                IBM BoB Decision Support Mode
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-display">
              Clinical Risk Stratification & Resource Matching
            </h2>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-400">Triage Severity</div>
            <div className="text-xs text-slate-300 font-mono font-semibold">
              Score: {assessment.severityScore}/100
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg ${style.badge} ring-4 ${style.ring}`}>
            <ShieldAlert className="w-4 h-4 animate-ping" />
            <span>{assessment.severity} RISK</span>
          </div>
        </div>
      </div>

      {/* Clinical Assessment Summary */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              AI Clinical Summary
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {assessment.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {/* Risk Indicators Detected */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5 mb-3">
            <HeartPulse className="w-4 h-4" />
            <span>Hemodynamic & Clinical Risk Indicators</span>
          </h3>
          <ul className="space-y-2">
            {assessment.riskIndicators.map((risk, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-200 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Required Capabilities Extracted */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Required Hospital Capabilities Extracted</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {assessment.requiredCapabilities.map((cap, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/70 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital Pre-Alert Message */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <FileBadge className="w-3.5 h-3.5" />
            <span>Structured Pre-Alert Notification for Receiving Hospital</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Auto-Generated</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-xs text-slate-300 border border-slate-800/80">
          {assessment.preAlertMessage}
        </div>
      </div>

      {/* Mandatory Medical Safety Disclaimer */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start space-x-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong className="text-slate-300">Decision-Support Notice:</strong> {assessment.disclaimer}
        </p>
      </div>
    </div>
  );
};
