import React, { useState } from 'react';
import {
  Building2,
  AlertOctagon,
  HeartPulse,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  Save,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Droplet,
  Pill,
} from 'lucide-react';
import { Hospital, EmergencyCase, CaseStatus } from '../types.js';

interface HospitalDashboardProps {
  hospitals: Hospital[];
  currentHospital: Hospital;
  onSelectHospital: (hospital: Hospital) => void;
  activeCase?: EmergencyCase;
  onAcceptCase: (caseId: string) => void;
  onDeclineCase: (caseId: string, reason: string) => void;
  onUpdateChecklist: (caseId: string, itemId: string, status: 'REQUESTED' | 'PREPARING' | 'READY') => void;
  onUpdateResources: (hospitalId: string, updatedResources: any) => Promise<{ success: boolean; error?: string }>;
  onRefreshHospitals: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  hospitals,
  currentHospital,
  onSelectHospital,
  activeCase,
  onAcceptCase,
  onDeclineCase,
  onUpdateChecklist,
  onUpdateResources,
  onRefreshHospitals,
}) => {
  // Local edit states for resources
  const [totalICU, setTotalICU] = useState<number>(currentHospital.resources.totalICU);
  const [availableICU, setAvailableICU] = useState<number>(currentHospital.resources.availableICU);
  const [totalBeds, setTotalBeds] = useState<number>(currentHospital.resources.totalBeds);
  const [availableBeds, setAvailableBeds] = useState<number>(currentHospital.resources.availableBeds);
  const [oxygenUnits, setOxygenUnits] = useState<number>(currentHospital.resources.oxygenUnits);
  const [ventilators, setVentilators] = useState<number>(currentHospital.resources.ventilatorsAvailable);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when selected hospital changes
  const handleHospitalChange = (hospitalId: string) => {
    const target = hospitals.find((h) => h.id === hospitalId);
    if (target) {
      onSelectHospital(target);
      setTotalICU(target.resources.totalICU);
      setAvailableICU(target.resources.availableICU);
      setTotalBeds(target.resources.totalBeds);
      setAvailableBeds(target.resources.availableBeds);
      setOxygenUnits(target.resources.oxygenUnits);
      setVentilators(target.resources.ventilatorsAvailable);
      setFeedbackMsg(null);
    }
  };

  const handleSaveResources = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    const updated = {
      ...currentHospital.resources,
      totalICU: Number(totalICU),
      availableICU: Number(availableICU),
      totalBeds: Number(totalBeds),
      availableBeds: Number(availableBeds),
      oxygenUnits: Number(oxygenUnits),
      ventilatorsAvailable: Number(ventilators),
    };

    const res = await onUpdateResources(currentHospital.id, updated);
    setIsSaving(false);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: 'Hospital resources successfully validated and synchronized to PRAANJEEV network.',
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Failed to update resources.',
      });
    }
  };

  // Hackathon Scenario 2 Trigger: Test Fake Data Protection
  const triggerFakeDataAnomalyTest = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    // Deliberately violates the rule: Available ICU (35) > Total ICU (20)
    const invalidResources = {
      ...currentHospital.resources,
      totalICU: 20,
      availableICU: 35,
    };
    setTotalICU(20);
    setAvailableICU(35);

    const res = await onUpdateResources(currentHospital.id, invalidResources);
    setIsSaving(false);
    if (!res.success) {
      setFeedbackMsg({
        type: 'error',
        text: `❌ ${res.error} (Anomaly automatically intercepted & recorded in immutable Audit Log)`,
      });
    }
  };

  const isCaseAssignedToThisHospital = activeCase && activeCase.selectedHospitalId === currentHospital.id;

  return (
    <div className="space-y-6">
      {/* Hospital Switcher & Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span>Hospital Emergency Command Center</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px]">
              NABH Network
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white font-display">
            {currentHospital.name}
          </h2>
          <p className="text-xs text-slate-400">
            {currentHospital.address} | Registration: <span className="font-mono text-slate-300">{currentHospital.registrationNumber}</span>
          </p>
        </div>

        {/* Hospital Switcher Dropdown */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <label className="text-xs text-slate-400 font-semibold">Active Command:</label>
          <select
            value={currentHospital.id}
            onChange={(e) => handleHospitalChange(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hourly Freshness Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Hourly Resource Freshness System (Mandatory)</div>
            <div className="text-slate-400">
              Last Verified Update: <strong className="text-slate-200 font-mono">{new Date(currentHospital.lastResourceUpdate).toLocaleTimeString()}</strong> | Next Update Due: <strong className="text-cyan-300 font-mono">{new Date(currentHospital.nextUpdateDue).toLocaleTimeString()}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
            currentHospital.dataConfidence === 'HIGH'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
          }`}>
            Confidence Score: {currentHospital.dataConfidence}
          </span>
          <button
            onClick={onRefreshHospitals}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh network sync"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🚨 INCOMING EMERGENCY CASE NOTIFICATION */}
      {isCaseAssignedToThisHospital && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-rose-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg animate-pulse">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>INCOMING EMERGENCY CASE PRE-ALERT</span>
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Case ID: <span className="font-mono text-cyan-300">{activeCase.id}</span>
                </h3>
              </div>
            </div>

            {/* Accept / Decline Buttons */}
            <div className="flex items-center space-x-3">
              {activeCase.hospitalAcceptanceStatus === 'PENDING' ? (
                <>
                  <button
                    onClick={() => onAcceptCase(activeCase.id)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/60 transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPT EMERGENCY CASE</span>
                  </button>
                  <button
                    onClick={() =>
                      onDeclineCase(
                        activeCase.id,
                        'Resuscitation bay currently engaged in emergency surgical procedure'
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Unable to Accept (Auto-Reroute)</span>
                  </button>
                </>
              ) : activeCase.hospitalAcceptanceStatus === 'ACCEPTED' ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>CASE ACCEPTED — PREPARATION IN PROGRESS</span>
                </span>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
                  CASE DECLINED (Auto-Rerouted to network)
                </span>
              )}
            </div>
          </div>

          {/* Patient Details & AI Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-400">Patient Clinical Profile</h4>
              <div className="space-y-1 text-slate-200">
                <p>Name: <strong className="text-white">{activeCase.patientName}</strong></p>
                <p>Age/Gender: <strong>{activeCase.patientAge} years, {activeCase.patientGender}</strong></p>
                <p>Blood Group: <strong className="text-rose-400">{activeCase.patientBloodGroup}</strong></p>
                <p>Complaint: <strong className="text-amber-300">{activeCase.mainComplaint}</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-rose-400">Transmitted Vital Signs</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-200 font-mono">
                <div>Heart Rate: <strong className="text-rose-400">{activeCase.vitals.heartRate} bpm</strong></div>
                <div>SpO₂: <strong className="text-rose-400">{activeCase.vitals.spO2}%</strong></div>
                <div>Blood Pressure: <strong>{activeCase.vitals.bloodPressure}</strong></div>
                <div>Resp. Rate: <strong>{activeCase.vitals.respiratoryRate}/min</strong></div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Consciousness: <strong className="text-emerald-400">{activeCase.vitals.consciousness}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-cyan-400">AI-Identified Mobilization Requirements</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeCase.aiAssessment.requiredCapabilities.map((req, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-semibold">
                    {req}
                  </span>
                ))}
              </div>
              <div className="pt-2 text-slate-300">
                Ambulance Priority Corridor ETA: <strong className="text-emerald-400 font-mono text-sm">{activeCase.route?.etaMinutes ?? 8} minutes</strong>
              </div>
            </div>
          </div>

          {/* Advance Preparation Checklist Toggles */}
          {activeCase.hospitalAcceptanceStatus === 'ACCEPTED' && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hospital Advance Preparation Checklist (Pre-Arrival Mobilization)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Update status so incoming ambulance team sees real-time hospital readiness
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {activeCase.preparationChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 text-xs"
                  >
                    <span className="font-semibold text-slate-200 leading-tight">{item.label}</span>
                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={() => onUpdateChecklist(activeCase.id, item.id, 'PREPARING')}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                          item.status === 'PREPARING'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        onClick={() => onUpdateChecklist(activeCase.id, item.id, 'READY')}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                          item.status === 'READY'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Ready ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resource & Stock Management Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Real-Time Bed, ICU & Emergency Resource Management</span>
            </h3>
            <p className="text-xs text-slate-400">
              Validated inventory feeds into PRAANJEEV's AI Hospital Ranking algorithm every hour.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Hackathon Test 2: Invalid Data Protection Button */}
            <button
              onClick={triggerFakeDataAnomalyTest}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
              title="Test system anomaly detection by trying to submit Available ICU (35) > Total ICU (20)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Anti-Fake Data Protection</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-600 text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Resource Editors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ICU Capacity */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              ICU Capacity (Critical)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Total ICU</label>
                <input
                  type="number"
                  min={0}
                  value={totalICU}
                  onChange={(e) => setTotalICU(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Available ICU</label>
                <input
                  type="number"
                  min={0}
                  value={availableICU}
                  onChange={(e) => setAvailableICU(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-500">
              Rule: Available cannot exceed Total.
            </span>
          </div>

          {/* General Beds */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Emergency & Inpatient Beds
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Total Beds</label>
                <input
                  type="number"
                  min={0}
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Available Beds</label>
                <input
                  type="number"
                  min={0}
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-500">
              Occupied: {totalBeds - availableBeds}
            </span>
          </div>

          {/* Oxygen Reserve */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Oxygen Stock & Reserve
            </span>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Cylinders / Manifold (Units)</label>
              <input
                type="number"
                min={0}
                value={oxygenUnits}
                onChange={(e) => setOxygenUnits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <span className={`text-[10px] font-bold ${oxygenUnits < 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Status: {oxygenUnits < 15 ? 'CRITICAL RESERVE' : 'OPTIMAL'}
            </span>
          </div>

          {/* Ventilators */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Ventilators & Monitoring
            </span>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Available Ventilators</label>
              <input
                type="number"
                min={0}
                value={ventilators}
                onChange={(e) => setVentilators(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500">
              Cardiac Telemetry: {currentHospital.resources.cardiacCareAvailable ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Save Resources Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveResources}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-950/50 transition disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Validating & Publishing...' : 'Save & Publish Hourly Update'}</span>
          </button>
        </div>

        {/* Medicines Inventory Overview */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
            <Pill className="w-4 h-4 text-cyan-400" />
            <span>Critical Emergency Pharmacy & Anticoagulant Reserves</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Stock Quantity</th>
                  <th className="py-2.5 px-3">Threshold</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {currentHospital.medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-950/50">
                    <td className="py-2.5 px-3 text-white font-semibold">{med.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{med.category}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{med.quantity} {med.unit}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{med.minimumThreshold}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        med.status === 'AVAILABLE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : med.status === 'LOW'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
