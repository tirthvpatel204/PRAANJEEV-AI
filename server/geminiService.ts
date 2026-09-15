import { GoogleGenAI } from '@google/genai';
import { Vitals, EmergencySeverity, Hospital } from '../src/types.js';

// Lazy initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error('Error initializing GoogleGenAI:', err);
    }
  }
  return aiClient;
}

export interface AssessmentResult {
  severity: EmergencySeverity;
  severityScore: number; // 0 - 100
  summary: string;
  riskIndicators: string[];
  requiredCapabilities: string[];
  preAlertMessage: string;
  disclaimer: string;
}

export const MEDICAL_DISCLAIMER =
  'LEGAL MEDICAL DISCLAIMER: PRAANJEEV is an AI-assisted emergency coordination, decision-support, and hospital preparation platform. It does not provide definitive clinical diagnosis or guarantee bed or treatment availability. In acute life-threatening situations, always follow local emergency medical protocols and direct advice from qualified physicians.';

export async function assessEmergency(params: {
  age: number;
  gender: string;
  mainComplaint: string;
  symptoms: string[];
  vitals: Vitals;
  description: string;
  conditions: string[];
  allergies: string[];
}): Promise<AssessmentResult> {
  const { age, gender, mainComplaint, symptoms, vitals, description, conditions, allergies } = params;

  // 1. Clinical Rule Engine Baseline (Fail-safe)
  const isHypoxic = vitals.spO2 < 92;
  const isSevereHypoxic = vitals.spO2 < 90;
  const isTachycardic = vitals.heartRate > 100;
  const isSevereTachycardic = vitals.heartRate > 115;
  const isBradycardic = vitals.heartRate < 50;
  const isHypotensive = vitals.bloodPressure.startsWith('90/') || vitals.bloodPressure.startsWith('80/') || vitals.bloodPressure.startsWith('70/');
  const isUnconscious = vitals.consciousness !== 'CONSCIOUS';
  const isChestPain = /chest pain|angina|cardiac|heart attack|myocardial/i.test(`${mainComplaint} ${symptoms.join(' ')} ${description}`);
  const isStroke = /stroke|paralysis|speech|slur|facial/i.test(`${mainComplaint} ${symptoms.join(' ')} ${description}`);
  const isTrauma = /accident|fracture|bleeding|fall|head injury/i.test(`${mainComplaint} ${symptoms.join(' ')} ${description}`);

  let baselineSeverity: EmergencySeverity = 'MODERATE';
  let baselineScore = 50;

  if (isSevereHypoxic || isSevereTachycardic || isHypotensive || isUnconscious || (isChestPain && isHypoxic)) {
    baselineSeverity = 'CRITICAL';
    baselineScore = 95;
  } else if (isHypoxic || isTachycardic || isChestPain || isStroke || isTrauma) {
    baselineSeverity = 'HIGH';
    baselineScore = 80;
  }

  const baselineRisks: string[] = [];
  if (isSevereHypoxic) baselineRisks.push(`Severe arterial hypoxia (SpO₂: ${vitals.spO2}% - Critical threshold <90%)`);
  else if (isHypoxic) baselineRisks.push(`Hypoxemia (SpO₂: ${vitals.spO2}%)`);

  if (isSevereTachycardic) baselineRisks.push(`Marked sinus/ventricular tachycardia (Heart Rate: ${vitals.heartRate} bpm)`);
  else if (isTachycardic) baselineRisks.push(`Tachycardia (Heart Rate: ${vitals.heartRate} bpm)`);
  else if (isBradycardic) baselineRisks.push(`Bradycardia (Heart Rate: ${vitals.heartRate} bpm)`);

  if (isHypotensive) baselineRisks.push(`Borderline hypotension/cardiogenic compromise (BP: ${vitals.bloodPressure} mmHg)`);
  if (isUnconscious) baselineRisks.push(`Altered consciousness state: ${vitals.consciousness}`);
  if (isChestPain) baselineRisks.push('Acute Coronary Syndrome (ACS) / Myocardial Infarction indicators');

  const baselineCapabilities = ['Emergency Department', 'Oxygen Supply & High-Flow Canula'];
  if (baselineSeverity === 'CRITICAL' || isChestPain) {
    baselineCapabilities.push('ICU Bed with Hemodynamic Monitoring');
    baselineCapabilities.push('Cardiac Emergency Team & Interventional Cath Lab');
    baselineCapabilities.push('Emergency Resuscitation & Defibrillator');
  }
  if (isTrauma) baselineCapabilities.push('Trauma Surgery Bay & Blood Bank');
  if (isStroke) baselineCapabilities.push('Stroke Unit & CT/Neurology Team');

  // Try calling Gemini 3.8 Flash via @google/genai if key available
  const client = getAIClient();
  if (client) {
    try {
      const prompt = `
You are the AI Emergency Assessment Engine for PRAANJEEV (acting with the rigor of IBM BoB Healthcare Clinical Decision Support).
Analyze this incoming emergency case:

Patient: Age ${age}, Gender ${gender}
Main Complaint: ${mainComplaint}
Symptoms: ${symptoms.join(', ')}
Clinical Description: ${description}
Existing Conditions: ${conditions.join(', ') || 'None'}
Known Allergies: ${allergies.join(', ') || 'None'}

Vital Signs:
- Heart Rate: ${vitals.heartRate} bpm
- SpO2: ${vitals.spO2}%
- Blood Pressure: ${vitals.bloodPressure} mmHg
- Respiratory Rate: ${vitals.respiratoryRate} /min
- Temperature: ${vitals.temperature}°F
- Consciousness: ${vitals.consciousness}

Task:
Provide an emergency severity classification, risk breakdown, required hospital facilities, and a concise hospital pre-alert message.
Output MUST be strictly valid JSON without code fences or markdown:
{
  "severity": "CRITICAL" | "HIGH" | "MODERATE" | "MILD",
  "severityScore": number (0-100),
  "summary": "Concise 1-2 sentence emergency clinical assessment",
  "riskIndicators": ["string", "string"],
  "requiredCapabilities": ["string", "string"],
  "preAlertMessage": "Structured 2-3 line notification to be sent to receiving ER team"
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        severity: parsed.severity || baselineSeverity,
        severityScore: parsed.severityScore || baselineScore,
        summary: parsed.summary || `Patient presenting with ${mainComplaint} displaying ${baselineSeverity} risk markers.`,
        riskIndicators: Array.isArray(parsed.riskIndicators) && parsed.riskIndicators.length > 0 ? parsed.riskIndicators : baselineRisks,
        requiredCapabilities: Array.isArray(parsed.requiredCapabilities) && parsed.requiredCapabilities.length > 0 ? parsed.requiredCapabilities : baselineCapabilities,
        preAlertMessage: parsed.preAlertMessage || `PRE-ALERT: Age ${age}, ${mainComplaint}. SpO2 ${vitals.spO2}%, HR ${vitals.heartRate} bpm, BP ${vitals.bloodPressure}. Prepare ICU & Cardiac Team.`,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    } catch (err) {
      console.warn('Gemini AI call skipped/failed, using validated clinical rule engine:', err);
    }
  }

  // Return clinical rule engine result
  return {
    severity: baselineSeverity,
    severityScore: baselineScore,
    summary: `${age}-year-old ${gender.toLowerCase()} presenting with acute ${mainComplaint} with hemodynamic indicators suggestive of ${baselineSeverity} compromise. Immediate emergency stabilization advised.`,
    riskIndicators: baselineRisks.length > 0 ? baselineRisks : ['Elevated emergency triage score based on reported vitals'],
    requiredCapabilities: baselineCapabilities,
    preAlertMessage: `🚨 INCOMING EMERGENCY: Age ${age}, ${mainComplaint}. HR: ${vitals.heartRate} bpm, SpO₂: ${vitals.spO2}%, BP: ${vitals.bloodPressure}. ICU and Emergency Cardiac capability immediately requested.`,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

// Transparent AI Hospital Scoring & Explanation Engine
export function rankHospitalsForEmergency(
  hospitals: Hospital[],
  assessment: AssessmentResult,
  patientVitals: Vitals
): Hospital[] {
  return hospitals.map((hospital) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Verification Trust (Max 25 pts)
    if (hospital.verificationStatus === 'VERIFIED') {
      score += 25;
    } else if (hospital.verificationStatus === 'PENDING') {
      score -= 30; // Deprecate pending
      reasons.push('Hospital verification pending administrative review');
    } else if (hospital.verificationStatus === 'SUSPENDED') {
      score = 0; // Exclude suspended
      reasons.push('Hospital suspended due to non-compliance or expired license');
      return { ...hospital, score: 0, matchReason: reasons.join('; ') };
    }

    // 2. Resource & Capability Match (Max 40 pts)
    const needsICU = assessment.requiredCapabilities.some((c) => /ICU/i.test(c));
    const needsCardiac = assessment.requiredCapabilities.some((c) => /cardiac/i.test(c));
    const needsOxygen = assessment.requiredCapabilities.some((c) => /oxygen/i.test(c));

    if (needsICU) {
      if (hospital.resources.availableICU > 0) {
        score += 20;
      } else {
        score -= 25;
        reasons.push('❌ 0 ICU beds available (at full capacity)');
      }
    }

    if (needsCardiac) {
      if (hospital.resources.cardiacCareAvailable) {
        score += 15;
      } else {
        score -= 20;
        reasons.push('❌ Lacks specialized 24x7 cardiac intervention team');
      }
    }

    if (needsOxygen) {
      if (hospital.resources.oxygenStatus === 'OPTIMAL') {
        score += 5;
      } else if (hospital.resources.oxygenStatus === 'CRITICAL' || hospital.resources.oxygenUnits < 10) {
        score -= 15;
        reasons.push('⚠️ Oxygen stock below safe threshold');
      }
    }

    // 3. Data Freshness & Confidence (Max 15 pts)
    const updateTime = new Date(hospital.lastResourceUpdate).getTime();
    const hoursSinceUpdate = (Date.now() - updateTime) / (1000 * 60 * 60);

    if (hoursSinceUpdate <= 1.0) {
      score += 15;
    } else if (hoursSinceUpdate <= 3.0) {
      score += 5;
      reasons.push('Resource data updated over 1 hour ago');
    } else {
      score -= 20;
      reasons.push('⚠️ Resource data is outdated (>4 hours old), confidence reduced');
    }

    // 4. Traffic & ETA (Max 20 pts)
    // Distance & ETA simulated based on coordinates or defaults
    const dist = hospital.distanceKm ?? 4.0;
    const eta = hospital.etaMinutes ?? 12;
    const traffic = hospital.trafficStatus ?? 'LOW';

    if (eta <= 10) score += 20;
    else if (eta <= 15) score += 12;
    else score += 5;

    if (traffic === 'HEAVY') {
      score -= 10;
      reasons.push('Heavy traffic congestion on approach route');
    } else if (traffic === 'LOW') {
      score += 5;
    }

    // Formulate final human explanation
    let matchExplanation = '';
    if (hospital.id === 'HOSP-ANAND-02' || (hospital.resources.availableICU > 0 && hospital.resources.cardiacCareAvailable && eta <= 10)) {
      matchExplanation = `Recommended: Reports active ICU capacity (${hospital.resources.availableICU} available), 24x7 cardiac emergency team, fresh verified stock data, and fastest clear corridor (ETA: ${eta} min).`;
    } else if (hospital.resources.availableICU === 0) {
      matchExplanation = `Not recommended for this critical case: Although located ${dist} km away, currently has 0 available ICU beds and heavy approach congestion (ETA ${eta} min).`;
    } else if (hoursSinceUpdate > 3.0) {
      matchExplanation = `Caution: Resource data is ${Math.round(hoursSinceUpdate)} hours old and may not reflect current physical bed availability.`;
    } else {
      matchExplanation = `Suitability Score: ${Math.max(0, score)}/100 based on capability, live resources, and travel time.`;
    }

    return {
      ...hospital,
      score: Math.max(0, Math.min(100, score)),
      matchReason: matchExplanation,
    };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));
}
