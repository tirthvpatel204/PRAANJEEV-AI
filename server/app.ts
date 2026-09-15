import express from 'express';
import dotenv from 'dotenv';
import {
  INITIAL_HOSPITALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PATIENT,
  LOCATION_PRESETS,
} from './store.js';
import {
  assessEmergency,
  rankHospitalsForEmergency,
  MEDICAL_DISCLAIMER,
} from './geminiService.js';
import {
  Hospital,
  EmergencyCase,
  AuditLog,
  PatientProfile,
  PreparationChecklistItem,
  RouteOption,
} from '../src/types.js';

dotenv.config();

const app = express();

app.use(express.json());

// Enable CORS for flexibility across preview / Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory Persistence Stores (Clone seeded data)
let hospitals: Hospital[] = JSON.parse(JSON.stringify(INITIAL_HOSPITALS));
let emergencyCases: Record<string, EmergencyCase> = {};
let auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
let currentPatient: PatientProfile = JSON.parse(JSON.stringify(INITIAL_PATIENT));

// Helper: Calculate distance between two lat/lng in km (Haversine formula)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

// Generate unique Emergency Case ID: PJ-2026-XXXXXX
function generateCaseId(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PJ-2026-${randomDigits}`;
}

// ==========================================
// 0. HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'PRAANJEEV AI Emergency Coordination Platform',
    version: '2.4.0',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 1. PATIENT AUTH & PROFILE ENDPOINTS
// ==========================================

app.post('/api/patient/register', (req, res) => {
  const { name, email, phone, age, gender, bloodGroup, emergencyContact } = req.body;
  currentPatient = {
    id: `PAT-${Date.now()}`,
    name: name || 'Rajesh Patel',
    email: email || 'patient@example.com',
    phone: phone || '+91 98251 00000',
    age: Number(age) || 45,
    gender: gender || 'MALE',
    bloodGroup: bloodGroup || 'B+',
    emergencyContact: emergencyContact || { name: 'Hansaben', phone: '+91 98251 11111', relation: 'Spouse' },
    isVerified: true,
    conditions: ['Mild Hypertension'],
    allergies: ['Penicillin'],
    medications: ['Telmisartan 40mg'],
    pastSurgeries: [],
  };

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: currentPatient.id,
    actorName: currentPatient.name,
    actorRole: 'PATIENT',
    action: 'PATIENT_REGISTERED_AND_VERIFIED',
    entityType: 'VERIFICATION',
    entityId: currentPatient.id,
    newValue: `Verified via OTP (Email & Mobile: ${currentPatient.phone})`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, patient: currentPatient });
});

app.post('/api/patient/login', (req, res) => {
  res.json({ success: true, patient: currentPatient });
});

app.get('/api/patient/profile', (req, res) => {
  res.json({ success: true, patient: currentPatient });
});

// Location presets endpoint
app.get('/api/locations', (req, res) => {
  res.json({ success: true, presets: LOCATION_PRESETS });
});

// ==========================================
// 2. NEARBY HOSPITALS (LOCATION INTELLIGENCE)
// ==========================================

app.get('/api/hospitals/nearby', (req, res) => {
  const { city, country, lat, lng } = req.query;

  const targetCity = (city as string) || 'Anand';
  const targetCountry = (country as string) || 'India';
  const userLat = lat ? parseFloat(lat as string) : 22.5645;
  const userLng = lng ? parseFloat(lng as string) : 72.9289;

  let matched = hospitals.filter(
    (h) =>
      h.country.toLowerCase() === targetCountry.toLowerCase() &&
      (h.city.toLowerCase() === targetCity.toLowerCase() ||
        h.stateRegion.toLowerCase() === targetCity.toLowerCase())
  );

  if (matched.length === 0) {
    matched = hospitals.filter(
      (h) => h.country.toLowerCase() === targetCountry.toLowerCase()
    );
  }

  const results = matched.map((h) => {
    const dist = calculateDistanceKm(userLat, userLng, h.lat, h.lng);
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

  res.json({ success: true, hospitals: results });
});

// ==========================================
// 3. AI EMERGENCY ASSESSMENT & HOSPITAL RANKING
// ==========================================

app.post('/api/emergency/assess', async (req, res) => {
  try {
    const {
      age = 45,
      gender = 'MALE',
      mainComplaint = 'Severe chest pain radiating to left arm',
      symptoms = ['Chest pain', 'Shortness of breath', 'Cold sweats', 'Dizziness'],
      vitals = {
        heartRate: 118,
        spO2: 89,
        bloodPressure: '90/60',
        temperature: 98.6,
        respiratoryRate: 24,
        consciousness: 'CONSCIOUS',
      },
      description = 'Sudden crushing retrosternal pressure starting 45 minutes ago.',
      conditions = ['Mild Hypertension'],
      allergies = ['Penicillin'],
      location = { city: 'Anand', country: 'India', lat: 22.5645, lng: 72.9289 },
    } = req.body;

    const assessment = await assessEmergency({
      age,
      gender,
      mainComplaint,
      symptoms,
      vitals,
      description,
      conditions,
      allergies,
    });

    const targetCity = location.city || 'Anand';
    const targetCountry = location.country || 'India';
    const userLat = location.lat || 22.5645;
    const userLng = location.lng || 72.9289;

    let localHospitals = hospitals.filter(
      (h) =>
        h.country.toLowerCase() === targetCountry.toLowerCase() &&
        (h.city.toLowerCase() === targetCity.toLowerCase() ||
          h.stateRegion.toLowerCase() === targetCity.toLowerCase())
    );

    if (localHospitals.length === 0) {
      localHospitals = hospitals.filter(
        (h) => h.country.toLowerCase() === targetCountry.toLowerCase()
      );
    }

    const hospitalsWithMetrics = localHospitals.map((h) => {
      const dist = calculateDistanceKm(userLat, userLng, h.lat, h.lng);
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

    const rankedHospitals = rankHospitalsForEmergency(
      hospitalsWithMetrics,
      assessment,
      vitals
    );

    res.json({
      success: true,
      assessment,
      rankedHospitals,
    });
  } catch (err: any) {
    console.error('Error assessing emergency:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. EMERGENCY CASE CREATION & HOSPITAL SELECT
// ==========================================

app.post('/api/emergency/create', async (req, res) => {
  try {
    const {
      patient,
      vitals,
      mainComplaint,
      symptoms,
      description,
      conditions,
      allergies,
      medications,
      location,
      selectedHospitalId,
      consentGiven = true,
    } = req.body;

    const caseId = generateCaseId();

    const assessment = await assessEmergency({
      age: patient.age,
      gender: patient.gender,
      mainComplaint,
      symptoms,
      vitals,
      description,
      conditions,
      allergies,
    });

    const targetHospital = hospitals.find((h) => h.id === selectedHospitalId);

    const checklist: PreparationChecklistItem[] = [
      {
        id: 'chk-1',
        label: 'Dedicated ICU Bed with Cardiac Telemetry & Monitor',
        category: 'FACILITY',
        status: 'REQUESTED',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'chk-2',
        label: 'High-Flow Oxygen & Intubation Tray Ready',
        category: 'EQUIPMENT',
        status: 'REQUESTED',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'chk-3',
        label: 'Emergency Interventional Cardiac Team & Cath Lab Standby',
        category: 'PERSONNEL',
        status: 'REQUESTED',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'chk-4',
        label: 'Emergency Trauma / Resuscitation Bay 1 Cleared',
        category: 'FACILITY',
        status: 'REQUESTED',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'chk-5',
        label: 'Stat Blood Draw Kit & Emergency Aspirin/Heparin Dosing',
        category: 'PHARMACY',
        status: 'REQUESTED',
        timestamp: new Date().toISOString(),
      },
    ];

    const defaultRoutes: RouteOption[] = [
      {
        id: 'route-c',
        name: 'Route C — Anand Green Corridor / Lambhvel Bypass',
        distanceKm: 6.0,
        etaMinutes: 8,
        traffic: 'LOW',
        isRecommended: true,
        timeSavedMinutes: 9,
        description: 'Bypasses Station Road railway bottleneck via dedicated medical corridor.',
        waypoints: [
          [22.5645, 72.9289],
          [22.5710, 72.9370],
          [22.5780, 72.9460],
          [22.5830, 72.9520],
        ],
      },
      {
        id: 'route-b',
        name: 'Route B — Station Link Road',
        distanceKm: 7.1,
        etaMinutes: 12,
        traffic: 'MEDIUM',
        isRecommended: false,
        timeSavedMinutes: 5,
        description: 'Moderate traffic near commercial center.',
        waypoints: [
          [22.5645, 72.9289],
          [22.5680, 72.9320],
          [22.5750, 72.9410],
          [22.5830, 72.9520],
        ],
      },
      {
        id: 'route-a',
        name: 'Route A — Anand Main Highway',
        distanceKm: 5.2,
        etaMinutes: 18,
        traffic: 'HEAVY',
        isRecommended: false,
        timeSavedMinutes: 0,
        description: 'Severe congestion at Gamdi Vad signal.',
        waypoints: [
          [22.5645, 72.9289],
          [22.5620, 72.9340],
          [22.5700, 72.9450],
          [22.5830, 72.9520],
        ],
      },
    ];

    const newCase: EmergencyCase = {
      id: caseId,
      patientId: patient.id || 'PAT-GUEST',
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBloodGroup: patient.bloodGroup,
      patientContact: patient.phone,
      emergencyContact: patient.emergencyContact,
      isVerifiedPatient: Boolean(patient.isVerified),
      patientLocation: location,
      mainComplaint,
      symptoms,
      description,
      emergencyTime: new Date().toLocaleTimeString(),
      vitals,
      conditions,
      allergies,
      medications,
      severity: assessment.severity,
      aiAssessment: assessment,
      selectedHospitalId,
      selectedHospitalName: targetHospital?.name || 'Selected Verified Hospital',
      hospitalAcceptanceStatus: 'PENDING',
      consentGiven: Boolean(consentGiven),
      consentTimestamp: new Date().toISOString(),
      sharedFields: [
        'identity',
        'emergencyComplaint',
        'vitalSigns',
        'criticalAllergies',
        'gpsLocation',
        'requiredEmergencyCapabilities',
      ],
      status: 'HOSPITAL_NOTIFIED',
      preparationChecklist: checklist,
      route: {
        distanceKm: 6.0,
        etaMinutes: 8,
        trafficStatus: 'LOW',
        selectedRouteId: 'route-c',
        routes: defaultRoutes,
        liveRerouted: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    emergencyCases[caseId] = newCase;

    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: patient.id || 'PAT-GUEST',
      actorName: patient.name,
      actorRole: 'PATIENT',
      action: 'EMERGENCY_CASE_AND_CONSENT_REGISTERED',
      entityType: 'EMERGENCY_CASE',
      entityId: caseId,
      newValue: `Hospital: ${newCase.selectedHospitalName}, Severity: ${assessment.severity}`,
      reason: 'Patient gave informed consent for minimal necessary clinical data transmission.',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, caseId, emergencyCase: newCase });
  } catch (err: any) {
    console.error('Error creating emergency case:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/emergency/:case_id', (req, res) => {
  const caseId = req.params.case_id;
  const emergencyCase = emergencyCases[caseId];
  if (!emergencyCase) {
    return res.status(404).json({ success: false, error: 'Emergency case not found' });
  }
  res.json({ success: true, emergencyCase });
});

// Update Case Status (Timeline progression)
app.put('/api/emergency/:case_id/status', (req, res) => {
  const caseId = req.params.case_id;
  const { status } = req.body;
  const emergencyCase = emergencyCases[caseId];
  if (!emergencyCase) {
    return res.status(404).json({ success: false, error: 'Emergency case not found' });
  }

  const oldStatus = emergencyCase.status;
  emergencyCase.status = status;
  emergencyCase.updatedAt = new Date().toISOString();

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: 'SYS-COORDINATOR',
    actorName: 'PRAANJEEV Dispatch Engine',
    actorRole: 'SYSTEM_ADMIN',
    action: 'CASE_STATUS_UPDATED',
    entityType: 'EMERGENCY_CASE',
    entityId: caseId,
    oldValue: oldStatus,
    newValue: status,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, emergencyCase });
});

// ==========================================
// 5. HOSPITAL MANAGEMENT & PREPARATION
// ==========================================

app.get('/api/hospital/emergency-cases', (req, res) => {
  const { hospitalId } = req.query;
  const cases = Object.values(emergencyCases).filter(
    (c) => !hospitalId || c.selectedHospitalId === hospitalId
  );
  res.json({ success: true, cases });
});

app.put('/api/hospital/emergency-cases/:case_id/accept', (req, res) => {
  const caseId = req.params.case_id;
  const emergencyCase = emergencyCases[caseId];
  if (!emergencyCase) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  emergencyCase.hospitalAcceptanceStatus = 'ACCEPTED';
  emergencyCase.status = 'PREPARING';
  emergencyCase.updatedAt = new Date().toISOString();

  emergencyCase.preparationChecklist = emergencyCase.preparationChecklist.map((item) => ({
    ...item,
    status: 'PREPARING',
  }));

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: emergencyCase.selectedHospitalId || 'HOSP-STAFF',
    actorName: 'Hospital Triage Team',
    actorRole: 'HOSPITAL_STAFF',
    action: 'EMERGENCY_CASE_ACCEPTED',
    entityType: 'EMERGENCY_CASE',
    entityId: caseId,
    newValue: 'Case ACCEPTED — Advance preparation initiated',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, emergencyCase });
});

app.put('/api/hospital/emergency-cases/:case_id/decline', (req, res) => {
  const caseId = req.params.case_id;
  const { reason = 'Emergency resuscitation team currently engaged in active cardiac arrest code' } = req.body;
  const emergencyCase = emergencyCases[caseId];
  if (!emergencyCase) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  const previousHospital = emergencyCase.selectedHospitalName;
  emergencyCase.hospitalAcceptanceStatus = 'DECLINED';
  emergencyCase.declineReason = reason;

  const fallbackHospitals = hospitals.filter(
    (h) => h.id !== emergencyCase.selectedHospitalId && h.verificationStatus === 'VERIFIED'
  );
  const nextHospital = fallbackHospitals[0];

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: emergencyCase.selectedHospitalId || 'HOSP-STAFF',
    actorName: previousHospital || 'Hospital Staff',
    actorRole: 'HOSPITAL_STAFF',
    action: 'EMERGENCY_CASE_DECLINED_FALLBACK_TRIGGERED',
    entityType: 'EMERGENCY_CASE',
    entityId: caseId,
    oldValue: previousHospital,
    newValue: nextHospital?.name || 'Searching network...',
    reason,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Case declined. PRAANJEEV automatically re-evaluates nearby verified hospitals.',
    emergencyCase,
    suggestedAlternative: nextHospital,
  });
});

app.put('/api/hospital/emergency-cases/:case_id/checklist', (req, res) => {
  const caseId = req.params.case_id;
  const { itemId, status, assignedTo } = req.body;
  const emergencyCase = emergencyCases[caseId];
  if (!emergencyCase) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  emergencyCase.preparationChecklist = emergencyCase.preparationChecklist.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        status: status || item.status,
        assignedTo: assignedTo || item.assignedTo,
        timestamp: new Date().toISOString(),
      };
    }
    return item;
  });

  const allReady = emergencyCase.preparationChecklist.every((i) => i.status === 'READY');
  if (allReady && emergencyCase.status === 'PREPARING') {
    emergencyCase.status = 'AMBULANCE_EN_ROUTE';
  }

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: 'HOSP-TRIAGE-LEAD',
    actorName: 'Emergency Charge Nurse',
    actorRole: 'HOSPITAL_STAFF',
    action: 'PREPARATION_CHECKLIST_UPDATED',
    entityType: 'EMERGENCY_CASE',
    entityId: caseId,
    newValue: `Item ${itemId} set to ${status}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, emergencyCase });
});

// Update Hospital Resources with Strict Validation (Anti-Fake Data Engine)
app.put('/api/hospital/resources', (req, res) => {
  const { hospitalId, staffId = 'STF-PATEL', staffName = 'Dr. Ramesh Patel', resources } = req.body;
  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  // VALIDATION RULE 1: Available ICU cannot exceed Total ICU
  if (resources.availableICU > resources.totalICU) {
    const errorMsg = `Invalid resource value. Available ICU capacity (${resources.availableICU}) cannot exceed total capacity (${resources.totalICU}).`;
    
    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: staffId,
      actorName: staffName,
      actorRole: 'HOSPITAL_STAFF',
      action: 'DATA_ANOMALY_BLOCKED',
      entityType: 'RESOURCE',
      entityId: hospitalId,
      oldValue: `Total ICU: ${hospital.resources.totalICU}, Avail ICU: ${hospital.resources.availableICU}`,
      newValue: `Rejected: Avail ICU: ${resources.availableICU}`,
      reason: errorMsg,
      timestamp: new Date().toISOString(),
      anomalyDetected: true,
    });

    return res.status(400).json({
      success: false,
      error: errorMsg,
      anomalyDetected: true,
    });
  }

  // VALIDATION RULE 2: Available Beds cannot exceed Total Beds
  if (resources.availableBeds > resources.totalBeds) {
    const errorMsg = `Invalid resource value. Available beds (${resources.availableBeds}) cannot exceed total beds (${resources.totalBeds}).`;
    return res.status(400).json({ success: false, error: errorMsg });
  }

  // VALIDATION RULE 3: No negative numbers
  if (
    resources.availableICU < 0 ||
    resources.totalICU < 0 ||
    resources.availableBeds < 0 ||
    resources.totalBeds < 0 ||
    resources.oxygenUnits < 0
  ) {
    return res.status(400).json({ success: false, error: 'Resource counts cannot be negative numbers.' });
  }

  const oldValues = `ICU: ${hospital.resources.availableICU}/${hospital.resources.totalICU}, Beds: ${hospital.resources.availableBeds}/${hospital.resources.totalBeds}, O2: ${hospital.resources.oxygenUnits}`;
  hospital.resources = { ...hospital.resources, ...resources };
  hospital.lastResourceUpdate = new Date().toISOString();
  hospital.nextUpdateDue = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  hospital.dataConfidence = 'HIGH';

  const newValues = `ICU: ${hospital.resources.availableICU}/${hospital.resources.totalICU}, Beds: ${hospital.resources.availableBeds}/${hospital.resources.totalBeds}, O2: ${hospital.resources.oxygenUnits}`;

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: staffId,
    actorName: staffName,
    actorRole: 'HOSPITAL_STAFF',
    action: 'RESOURCE_UPDATE',
    entityType: 'RESOURCE',
    entityId: hospitalId,
    oldValue: oldValues,
    newValue: newValues,
    reason: 'Hourly verified resource sync',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, hospital });
});

// Update Medicines Stock
app.put('/api/hospital/medicines', (req, res) => {
  const { hospitalId, medicineId, quantity } = req.body;
  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  const med = hospital.medicines.find((m) => m.id === medicineId);
  if (med) {
    const oldQty = med.quantity;
    med.quantity = Number(quantity);
    med.status = med.quantity <= med.minimumThreshold ? 'LOW' : 'AVAILABLE';
    med.lastUpdated = new Date().toISOString();

    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: 'STF-PHARMACY',
      actorName: 'Hospital Pharmacist',
      actorRole: 'HOSPITAL_STAFF',
      action: 'MEDICINE_INVENTORY_UPDATE',
      entityType: 'MEDICINE',
      entityId: medicineId,
      oldValue: `Qty: ${oldQty}`,
      newValue: `Qty: ${med.quantity} (${med.status})`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ success: true, hospital });
});

// ==========================================
// 6. DYNAMIC TRAFFIC & LIVE REROUTING
// ==========================================

app.post('/api/route/recalculate', (req, res) => {
  const { caseId } = req.body;
  const emergencyCase = emergencyCases[caseId];

  const alternateRoute: RouteOption = {
    id: 'route-live-bypass',
    name: 'Dynamic Bypass: GIDC Expressway Link',
    distanceKm: 6.4,
    etaMinutes: 7,
    traffic: 'LOW',
    isRecommended: true,
    timeSavedMinutes: 4,
    description: 'Bypasses newly reported accident backlog at Lambhvel Junction.',
    waypoints: [
      [22.5645, 72.9289],
      [22.5700, 72.9330],
      [22.5790, 72.9400],
      [22.5830, 72.9520],
    ],
  };

  if (emergencyCase && emergencyCase.route) {
    emergencyCase.route.liveRerouted = true;
    emergencyCase.route.selectedRouteId = 'route-live-bypass';
    emergencyCase.route.etaMinutes = 7;
    emergencyCase.route.trafficStatus = 'LOW';
    emergencyCase.route.rerouteNotice = '⚠️ Heavy traffic detected ahead on corridor. Dynamic detour activated: Previous ETA 11 min → New ETA 7 min (Saved 4 min).';
    if (!emergencyCase.route.routes.find((r) => r.id === 'route-live-bypass')) {
      emergencyCase.route.routes.unshift(alternateRoute);
    }
  }

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: 'AI-TRAFFIC-ENGINE',
    actorName: 'PRAANJEEV Dynamic Traffic Sentinel',
    actorRole: 'SYSTEM_ADMIN',
    action: 'DYNAMIC_REROUTE_EXECUTED',
    entityType: 'EMERGENCY_CASE',
    entityId: caseId || 'DEMO-CASE',
    oldValue: 'ETA: 11 min (Corridor Congestion)',
    newValue: 'ETA: 7 min (GIDC Expressway Bypass)',
    reason: 'Dynamic traffic reroute triggered to ensure fastest practical emergency route.',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    newRoute: alternateRoute,
    emergencyCase,
  });
});

// ==========================================
// 7. SYSTEM ADMIN VERIFICATION PORTAL
// ==========================================

app.get('/api/admin/hospitals', (req, res) => {
  res.json({ success: true, hospitals });
});

app.put('/api/admin/hospitals/:id/verify', (req, res) => {
  const hospitalId = req.params.id;
  const { reason = 'Accreditation and physical infrastructure verified by field inspector' } = req.body;
  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  const oldStatus = hospital.verificationStatus;
  hospital.verificationStatus = 'VERIFIED';

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: 'ADM-CHIEF-01',
    actorName: 'Dr. V. K. Mehta (Chief Verification Officer)',
    actorRole: 'SYSTEM_ADMIN',
    action: 'HOSPITAL_VERIFIED',
    entityType: 'VERIFICATION',
    entityId: hospitalId,
    oldValue: oldStatus,
    newValue: 'VERIFIED',
    reason,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, hospital });
});

app.put('/api/admin/hospitals/:id/suspend', (req, res) => {
  const hospitalId = req.params.id;
  const { reason = 'License verification anomaly or infrastructure compliance failure' } = req.body;
  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  const oldStatus = hospital.verificationStatus;
  hospital.verificationStatus = 'SUSPENDED';

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actorId: 'ADM-CHIEF-01',
    actorName: 'Dr. V. K. Mehta (Chief Verification Officer)',
    actorRole: 'SYSTEM_ADMIN',
    action: 'HOSPITAL_SUSPENDED',
    entityType: 'VERIFICATION',
    entityId: hospitalId,
    oldValue: oldStatus,
    newValue: 'SUSPENDED',
    reason,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, hospital });
});

app.get('/api/admin/audit-logs', (req, res) => {
  res.json({ success: true, logs: auditLogs });
});

// Reset Demo Data Endpoint
app.post('/api/demo/reset', (req, res) => {
  hospitals = JSON.parse(JSON.stringify(INITIAL_HOSPITALS));
  emergencyCases = {};
  auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  currentPatient = JSON.parse(JSON.stringify(INITIAL_PATIENT));
  res.json({ success: true, message: 'All demo datasets reinitialized to baseline.' });
});

export default app;
export { app };
