import React from 'react';
import {
  Shield,
  HeartPulse,
  Route,
  Clock,
  CheckCircle2,
  Cpu,
  Building,
  Navigation,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface UspBannerProps {
  onStartEmergency: () => void;
  activeCaseId?: string;
}

export const UspBanner: React.FC<UspBannerProps> = ({ onStartEmergency, activeCaseId }) => {
  const steps = [
    { title: 'Patient Verification', icon: ShieldCheck, desc: 'Verified Identity & Vitals' },
    { title: 'Location Detection', icon: Navigation, desc: 'GPS & Area Scoping' },
    { title: 'AI Assessment', icon: Cpu, desc: 'Severity & Resource Extraction' },
    { title: 'Verified Hospital Network', icon: Building, desc: 'NABH/Govt Checked' },
    { title: 'Live Resources Intelligence', icon: HeartPulse, desc: 'Hourly Fresh ICU & O₂' },
    { title: 'Traffic-Aware Routing', icon: Route, desc: 'Fastest Practical Route' },
    { title: 'Hospital Advance Preparation', icon: Clock, desc: 'Bed & Team Ready' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Core Tagline & USP Banner */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-950/70 border border-rose-700/60 text-rose-300 text-xs font-semibold mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>CRITICAL CARE COORDINATION ARCHITECTURE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight font-display">
            The <span className="text-cyan-400">Right Patient</span>. The{' '}
            <span className="text-emerald-400">Right Hospital</span>. The{' '}
            <span className="text-amber-400">Right Resources</span>. Through the{' '}
            <span className="text-rose-400">Fastest Route</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium mb-2 max-w-3xl mx-auto">
            “PRAANJEEV connects the right patient to the right verified hospital, with the right resources, through the fastest practical route — before every precious second is lost.”
          </p>

          <p className="text-xs sm:text-sm text-cyan-300 font-medium tracking-wide">
            “When a life is at stake, trust cannot be optional.”
          </p>
        </div>

        {/* 7-Stage End-to-End Workflow Pipeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl p-3 text-center transition group shadow-md"
              >
                <div className="absolute -top-2 -left-2 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 font-mono">
                  {idx + 1}
                </div>
                <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition text-slate-300">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-semibold text-white mb-0.5 leading-snug">{step.title}</h2>
                <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Start / Active Case Alert */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartEmergency}
            className="flex items-center space-x-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-950/60 hover:shadow-rose-900/50 transition transform hover:-translate-y-0.5"
          >
            <HeartPulse className="w-5 h-5 animate-pulse text-white" />
            <span>Initiate Emergency Response Assessment</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {activeCaseId && (
            <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/70 text-cyan-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Active Case: <strong className="font-mono text-white">{activeCaseId}</strong></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
