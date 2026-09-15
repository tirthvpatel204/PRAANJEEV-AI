import React, { useState } from 'react';
import {
  Heart,
  Activity,
  AlertOctagon,
  ShieldCheck,
  User,
  Phone,
  Droplet,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PatientProfile, LocationPreset, Vitals } from '../types.js';

interface EmergencyFormProps {
  patient: PatientProfile;
  currentLocation: LocationPreset;
  onSubmit: (formData: {
    patient: PatientProfile;
    vitals: Vitals;
    mainComplaint: string;
    symptoms: string[];
    injuryDetails: string;
    description: string;
    location: LocationPreset;
  }) => void;
  isLoading: boolean;
}

const COMMON_SYMPTOMS = [
  'Severe chest pain',
  'Shortness of breath',
  'Left arm radiation',
  'Cold sweats',
  'Dizziness / Vertigo',
  'Loss of consciousness',
  'Head injury / Trauma',
  'Profuse bleeding',
  'Facial droop / Slurred speech',
  'Severe abdominal pain',
];

export const EmergencyForm: React.FC<EmergencyFormProps> = ({
  patient,
  currentLocation,
  onSubmit,
  isLoading,
}) => {
  // Form State
  const [patientData, setPatientData] = useState<PatientProfile>(patient);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Vitals
  const [heartRate, setHeartRate] = useState<number>(118);
  const [spO2, setSpO2] = useState<number>(89);
  const [bloodPressure, setBloodPressure] = useState<string>('90/60');
  const [temperature, setTemperature] = useState<number>(98.6);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(24);
  const [consciousness, setConsciousness] = useState<'CONSCIOUS' | 'SEMI_CONSCIOUS' | 'UNCONSCIOUS'>('CONSCIOUS');

  // Emergency Description
  const [mainComplaint, setMainComplaint] = useState<string>('Severe crushing retrosternal chest pain');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Severe chest pain',
    'Shortness of breath',
    'Left arm radiation',
    'Cold sweats',
  ]);
  const [injuryDetails, setInjuryDetails] = useState<string>('');
  const [description, setDescription] = useState<string>(
    'Patient developed sudden crushing chest discomfort 40 minutes ago while resting. Radiating to left shoulder and jaw, accompanied by profuse sweating and nausea.'
  );

  // Load Hackathon Demo Preset (45yo Anand Cardiac Emergency)
  const loadHackathonScenario = () => {
    setPatientData({
      id: 'PAT-IND-2026-045',
      name: 'Rajeshbhai M. Patel',
      email: 'rajesh.patel.anand@example.com',
      phone: '+91 98251 44556',
      age: 45,
      gender: 'MALE',
      bloodGroup: 'B+',
      emergencyContact: {
        name: 'Hansaben Patel',
        phone: '+91 98251 44557',
        relation: 'Spouse',
      },
      isVerified: true,
      conditions: ['Mild Hypertension', 'Borderline Dyslipidemia'],
      allergies: ['Penicillin', 'Sulfa Drugs'],
      medications: ['Telmisartan 40mg (OD)'],
      pastSurgeries: ['Appendectomy (2018)'],
    });
    setIsGuestMode(false);
    setHeartRate(118);
    setSpO2(89);
    setBloodPressure('90/60');
    setTemperature(98.6);
    setRespiratoryRate(24);
    setConsciousness('CONSCIOUS');
    setMainComplaint('Severe acute chest pain radiating to left arm');
    setSelectedSymptoms(['Severe chest pain', 'Shortness of breath', 'Left arm radiation', 'Cold sweats']);
    setDescription(
      '45-year-old patient experiencing acute substernal chest pressure with cold diaphoresis and acute shortness of breath. SpO2 critically low at 89%, tachycardia at 118 bpm.'
    );
  };

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vitals: Vitals = {
      heartRate: Number(heartRate),
      spO2: Number(spO2),
      bloodPressure,
      temperature: Number(temperature),
      respiratoryRate: Number(respiratoryRate),
      consciousness,
    };

    onSubmit({
      patient: {
        ...patientData,
        isVerified: !isGuestMode,
      },
      vitals,
      mainComplaint,
      symptoms: selectedSymptoms,
      injuryDetails,
      description,
      location: currentLocation,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      {/* Header & Hackathon Scenario Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                Emergency Case Registration & Clinical Triage
              </h2>
              <p className="text-xs text-slate-400">
                Provide patient status and current vitals for immediate AI severity assessment and verified hospital matching.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadHackathonScenario}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm self-start sm:self-auto"
          title="Autofill exact 45yo Anand Cardiac Emergency case"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Load Anand Cardiac Emergency Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Section 1: Patient Verification & Identity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>1. Patient Verification & Profile</span>
            </h3>

            <div className="flex items-center space-x-3 text-xs">
              <button
                type="button"
                onClick={() => setIsGuestMode(false)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  !isGuestMode
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                Verified Patient
              </button>
              <button
                type="button"
                onClick={() => setIsGuestMode(true)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  isGuestMode
                    ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Emergency Guest Mode (Unverified)
              </button>
            </div>
          </div>

          {isGuestMode && (
            <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Guest Emergency Flow:</strong> Case will be marked as unverified until formal hospital identity validation at reception.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={patientData.name}
                onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age & Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={patientData.age}
                  onChange={(e) => setPatientData({ ...patientData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Age"
                />
                <select
                  value={patientData.gender}
                  onChange={(e) => setPatientData({ ...patientData, gender: e.target.value as any })}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={patientData.bloodGroup}
                  onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. B+"
                />
                <Droplet className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={patientData.emergencyContact?.phone}
                  onChange={(e) =>
                    setPatientData({
                      ...patientData,
                      emergencyContact: { ...patientData.emergencyContact, phone: e.target.value },
                    })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Phone"
                />
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Vital Signs with Real-time Risk Threshold Highlighting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>2. Vital Signs & Hemodynamic Indicators</span>
            </h3>
            <span className="text-[11px] text-slate-400 italic">
              Values automatically trigger AI urgency stratification
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Heart Rate */}
            <div className={`p-3.5 rounded-xl border transition ${
              heartRate > 100 || heartRate < 50
                ? 'bg-rose-950/40 border-rose-700/80 shadow-inner'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Heart Rate</span>
                {heartRate > 100 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-600 text-white">
                    Tachycardia
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1.5">
                <input
                  type="number"
                  required
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-extrabold text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">bpm</span>
              </div>
              <span className="text-[10px] text-slate-500">Normal: 60-100</span>
            </div>

            {/* SpO2 */}
            <div className={`p-3.5 rounded-xl border transition ${
              spO2 < 90
                ? 'bg-red-950/60 border-red-600 shadow-inner'
                : spO2 < 94
                ? 'bg-amber-950/40 border-amber-700'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">SpO₂</span>
                {spO2 < 90 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-600 text-white animate-pulse">
                    Hypoxic
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1.5">
                <input
                  type="number"
                  required
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-extrabold text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-slate-500">Normal: 95-100%</span>
            </div>

            {/* Blood Pressure */}
            <div className={`p-3.5 rounded-xl border transition ${
              bloodPressure.startsWith('90/') || bloodPressure.startsWith('80/')
                ? 'bg-rose-950/40 border-rose-700'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Blood Pressure</span>
                {bloodPressure.startsWith('90/') && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-600 text-white">
                    Low
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="w-full bg-transparent text-xl font-extrabold text-white focus:outline-none font-mono"
                placeholder="120/80"
              />
              <span className="text-[10px] text-slate-500">mmHg</span>
            </div>

            {/* Temperature */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-xs font-semibold text-slate-300 mb-1">Temperature</span>
              <div className="flex items-baseline space-x-1.5">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-extrabold text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">°F</span>
              </div>
              <span className="text-[10px] text-slate-500">Normal: 98.6°F</span>
            </div>

            {/* Respiratory Rate */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-xs font-semibold text-slate-300 mb-1">Resp. Rate</span>
              <div className="flex items-baseline space-x-1.5">
                <input
                  type="number"
                  required
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-extrabold text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">/min</span>
              </div>
              <span className="text-[10px] text-slate-500">Normal: 12-20</span>
            </div>

            {/* Consciousness */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-xs font-semibold text-slate-300 mb-1">Consciousness</span>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs font-semibold mt-1 focus:outline-none"
              >
                <option value="CONSCIOUS">Conscious</option>
                <option value="SEMI_CONSCIOUS">Semi-Conscious</option>
                <option value="UNCONSCIOUS">Unconscious</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">AVPU scale</span>
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Symptoms & Description */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2 mb-3">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>3. Current Emergency Complaints & Symptoms</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Emergency Complaint</label>
              <input
                type="text"
                required
                value={mainComplaint}
                onChange={(e) => setMainComplaint(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                placeholder="e.g. Severe chest pain with sweating"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Active Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Emergency Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                placeholder="Describe onset, intensity, injury or circumstances..."
              />
            </div>
          </div>
        </div>

        {/* Location Verification Tag */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Geographic Scope: <strong className="text-white">{currentLocation.city}, {currentLocation.stateRegion}, {currentLocation.country}</strong> ({currentLocation.area})
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            Target Radius Active
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-base shadow-xl shadow-rose-950/70 transition transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running AI Emergency Assessment & Matching Verified Hospitals...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Trigger AI Emergency Assessment & Rank Verified Hospitals</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
