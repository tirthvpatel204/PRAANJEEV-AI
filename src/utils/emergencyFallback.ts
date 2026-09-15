import {
  Hospital,
  LocationPreset,
  Vitals,
  EmergencySeverity,
  PreparationChecklistItem,
  RouteOption,
  EmergencyCase,
} from '../types.js';
import { LOCATION_PRESETS, INITIAL_HOSPITALS } from '../../server/store.js';

export const FALLBACK_LOCATIONS: LocationPreset[] = LOCATION_PRESETS;
export const FALLBACK_HOSPITALS: Hospital[] = INITIAL_HOSPITALS;

export function fallbackCalculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export interface FallbackAssessmentResult {
  severity: EmergencySeverity;
  severityScore: number;
  summary: string;
  riskIndicators: string[];
  requiredCapabilities: string[];
  preAlertMessage: string;
  disclaimer: string;
  isFallback?: boolean;
}

export const FALLBACK_DISCLAIMER =
  'LEGAL MEDICAL DISCLAIMER: PRAANJEEV is an AI-assisted emergency coordination, decision-support, and hospital preparation platform. It does not provide definitive clinical diagnosis or guarantee bed or treatment availability. In acute life-threatening situations, always follow local emergency medical protocols and direct advice from qualified physicians.';

export function fallbackAssessEmergency(params: {
  age: number;
  gender: string;
  mainComplaint: string;
  symptoms: string[];
  vitals: Vitals;
  description: string;
  conditions?: string[];
  allergies?: string[];
}): FallbackAssessmentResult {
  const { age, gender, mainComplaint, symptoms, vitals, description, conditions = [], allergies = [] } = params;

  const isSevereHypoxic = vitals.spO2 < 90;
  const isHypoxic = vitals.spO2 < 92;
  const isSevereTachycardic = vitals.heartRate > 115;
  const isTachycardic = vitals.heartRate > 100;
  const isHypotensive =
    vitals.bloodPressure.startsWith('90/') ||
    vitals.bloodPressure.startsWith('80/') ||
    vitals.bloodPressure.startsWith('70/');
  const isUnconscious = vitals.consciousness !== 'CONSCIOUS';
  const textCorpus = `${mainComplaint} ${symptoms.join(' ')} ${description}`.toLowerCase();
  const isChestPain = /chest pain|angina|cardiac|heart attack|myocardial|radiation/.test(textCorpus);
  const isStroke = /stroke|paralysis|speech|slur|facial/.test(textCorpus);
  const isTrauma = /accident|fracture|bleeding|fall|head injury/.test(textCorpus);

  let severity: EmergencySeverity = 'MODERATE';
  let severityScore = 60;

  if (isSevereHypoxic || isSevereTachycardic || isHypotensive || isUnconscious || (isChestPain && isHypoxic)) {
    severity = 'CRITICAL';
    severityScore = 95;
  } else if (isHypoxic || isTachycardic || isChestPain || isStroke || isTrauma) {
    severity = 'HIGH';
    severityScore = 80;
  } else if (vitals.spO2 >= 96 && vitals.heartRate >= 60 && vitals.heartRate <= 95) {
    severity = 'MILD';
    severityScore = 30;
  }

  const riskIndicators: string[] = [];
  if (isSevereHypoxic || isHypoxic) riskIndicators.push(`Hypoxia detected (SpO₂: ${vitals.spO2}%)`);
  if (isSevereTachycardic || isTachycardic) riskIndicators.push(`Tachycardia present (Heart Rate: ${vitals.heartRate} bpm)`);
  if (isHypotensive) riskIndicators.push(`Borderline hypotension (${vitals.bloodPressure})`);
  if (isChestPain) riskIndicators.push('Acute Coronary Syndrome presentation with cardiac radiation');
  if (isStroke) riskIndicators.push('F.A.S.T. neurological acute stroke warning');
  if (isTrauma) riskIndicators.push('Active polytrauma or acute hemorrhage risk');
  if (conditions.length > 0) riskIndicators.push(`Underlying comorbidities: ${conditions.join(', ')}`);
  if (riskIndicators.length === 0) riskIndicators.push('Stable vital signs, acute symptom evaluation required');

  const requiredCapabilities: string[] = [];
  if (isChestPain || severity === 'CRITICAL') {
    requiredCapabilities.push('24x7 Interventional Cath Lab & Cardiology Standby');
    requiredCapabilities.push('Equipped ICU Bed with Telemetry & Ventilator Support');
  }
  if (isTrauma) {
    requiredCapabilities.push('Dedicated Trauma Resuscitation Bay');
    requiredCapabilities.push('Orthopedic / Neuro-surgical Emergency OT');
  }
  if (isHypoxic || severity === 'CRITICAL' || severity === 'HIGH') {
    requiredCapabilities.push('High-flow Oxygenation & Intubation Ready Kit');
  }
  if (allergies.length > 0) {
    requiredCapabilities.push(`Pharmacy alert: Patient allergic to ${allergies.join(', ')}`);
  }
  requiredCapabilities.push('Immediate Emergency Physician Triage on Ambulance Arrival');

  return {
    severity,
    severityScore,
    summary: `${severity} emergency presentation in a ${age}yo ${gender.toLowerCase()}. Key signs: ${mainComplaint}. Vital instability: SpO2 ${vitals.spO2}%, HR ${vitals.heartRate} bpm, BP ${vitals.bloodPressure}. Requires immediate advanced hospital preparation.`,
    riskIndicators,
    requiredCapabilities,
    preAlertMessage: `INCOMING ${severity} CODE: ${age}yo ${gender.toUpperCase()} presenting with ${mainComplaint}. Vitals: SpO2 ${vitals.spO2}%, HR ${vitals.heartRate}, BP ${vitals.bloodPressure}. Allergies: ${allergies.join(', ') || 'NKDA'}. Clear bay and standby specialist immediately.`,
    disclaimer: FALLBACK_DISCLAIMER,
    isFallback: true,
  };
}

export function fallbackRankHospitals(
  hospitals: Hospital[],
  assessment: FallbackAssessmentResult,
  vitals: Vitals
): Hospital[] {
  return hospitals
    .map((hospital) => {
      let score = 0;
      let reasons: string[] = [];

      // Exclude suspended
      if (hospital.verificationStatus === 'SUSPENDED') {
        return {
          ...hospital,
          score: 0,
          matchReason: 'Hospital suspended due to non-compliance or expired license',
        };
      }

      // 1. ICU Capacity (Weight 30)
      if (hospital.resources.availableICU > 0) {
        score += 30;
        reasons.push(`${hospital.resources.availableICU} ICU beds available`);
      } else {
        reasons.push('0 ICU beds available');
      }

      // 2. Specialty matching (Weight 25)
      const needsCardiac = assessment.requiredCapabilities.some((c) => /cardio|cath/i.test(c));
      const needsTrauma = assessment.requiredCapabilities.some((c) => /trauma|ot/i.test(c));

      if (needsCardiac && hospital.resources.cardiacCareAvailable) {
        score += 25;
        reasons.push('24x7 cardiac care active');
      } else if (needsTrauma && hospital.resources.traumaCareAvailable) {
        score += 25;
        reasons.push('Dedicated trauma care active');
      } else if (!needsCardiac && !needsTrauma) {
        score += 20;
      }

      // 3. Distance & ETA (Weight 25)
      const eta = hospital.etaMinutes ?? 15;
      if (eta <= 8) {
        score += 25;
        reasons.push(`Fast ETA (${eta} min via clear corridor)`);
      } else if (eta <= 15) {
        score += 15;
        reasons.push(`Moderate ETA (${eta} min)`);
      } else {
        score += 5;
        reasons.push(`High transit time (${eta} min)`);
      }

      // 4. Data Freshness & Confidence (Weight 10)
      if (hospital.dataConfidence === 'HIGH') {
        score += 10;
        reasons.push('Fresh verified resource data');
      } else {
        score += 2;
        reasons.push('Stale data warning');
      }

      // 5. Emergency Doctors (Weight 10)
      if (hospital.resources.emergencyDoctorsOnDuty >= 3) {
        score += 10;
        reasons.push(`${hospital.resources.emergencyDoctorsOnDuty} emergency doctors on duty`);
      } else {
        score += 4;
      }

      // Cap at 100
      score = Math.min(100, Math.max(0, score));

      let matchReason = '';
      if (hospital.resources.availableICU === 0 && assessment.severity === 'CRITICAL') {
        score = Math.min(score, 30);
        matchReason = `Not recommended for critical cases: Currently reports 0 available ICU beds despite proximity (${hospital.distanceKm ?? 2} km). Approach ETA: ${hospital.etaMinutes ?? 15} min.`;
      } else if (score >= 80) {
        matchReason = `Recommended Choice: ${hospital.resources.availableICU} ICU beds available, specialized team ready, and fastest practical corridor (ETA ${hospital.etaMinutes ?? 8} min).`;
      } else {
        matchReason = `Alternative Option: ${reasons.slice(0, 3).join(', ')}.`;
      }

      return {
        ...hospital,
        score,
        matchReason,
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function fallbackGetNearbyHospitals(
  city: string = 'Anand',
  country: string = 'India',
  lat: number = 22.5645,
  lng: number = 72.9289
): Hospital[] {
  let matched = FALLBACK_HOSPITALS.filter(
    (h) =>
      h.country.toLowerCase() === country.toLowerCase() &&
      (h.city.toLowerCase() === city.toLowerCase() ||
        h.stateRegion.toLowerCase() === city.toLowerCase())
  );

  if (matched.length === 0) {
    matched = FALLBACK_HOSPITALS.filter(
      (h) => h.country.toLowerCase() === country.toLowerCase()
    );
  }

  if (matched.length === 0) {
    matched = FALLBACK_HOSPITALS;
  }

  return matched.map((h) => {
    const dist = fallbackCalculateDistanceKm(lat, lng, h.lat, h.lng);
    let traffic: 'LOW' | 'MEDIUM' | 'HEAVY' = 'LOW';
    let eta = Math.round(dist * 2.2);

    if (h.id === 'HOSP-ANAND-02') {
      traffic = 'LOW';
      eta = 8;
    } else if (h.id === 'HOSP-ANAND-01') {
      traffic = 'HEAVY';
      eta = 17;
    } else if (h.id === 'HOSP-ANAND-03') {
      traffic = 'HEAVY';
      eta = 16;
    }

    return {
      ...h,
      distanceKm: dist,
      etaMinutes: eta,
      trafficStatus: traffic,
    };
  });
}
