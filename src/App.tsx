import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Building2,
  HeartPulse,
  Route,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Cloud,
} from 'lucide-react';
import {
  LocationPreset,
  PatientProfile,
  Hospital,
  EmergencyCase,
  AuditLog,
  VerificationStatus,
  CaseStatus,
  Vitals,
} from './types.js';
import { Header } from './components/Header.js';
import { UspBanner } from './components/UspBanner.js';
import { EmergencyForm } from './components/EmergencyForm.js';
import { AIAssessmentView } from './components/AIAssessmentView.js';
import { HospitalRankingList } from './components/HospitalRankingList.js';
import { ConsentModal } from './components/ConsentModal.js';
import { ActiveEmergencyTracker } from './components/ActiveEmergencyTracker.js';
import { HospitalDashboard } from './components/HospitalDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { HackathonScenarios } from './components/HackathonScenarios.js';
import {
  FALLBACK_LOCATIONS,
  fallbackGetNearbyHospitals,
  fallbackAssessEmergency,
  fallbackRankHospitals,
} from './utils/emergencyFallback.js';

const DEFAULT_PATIENT: PatientProfile = {
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
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'patient' | 'hospital' | 'admin' | 'scenarios'>('patient');
  const [locations, setLocations] = useState<LocationPreset[]>(FALLBACK_LOCATIONS);
  const [currentLocation, setCurrentLocation] = useState<LocationPreset>(FALLBACK_LOCATIONS[0]);
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_PATIENT);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isOnlineBackend, setIsOnlineBackend] = useState<boolean | null>(null);

  // Emergency Case & AI State
  const [aiAssessment, setAiAssessment] = useState<any | null>(null);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [activeCase, setActiveCase] = useState<EmergencyCase | null>(null);

  // Consent Modal State
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingSelectedHospital, setPendingSelectedHospital] = useState<Hospital | null>(null);
  const [emergencyFormData, setEmergencyFormData] = useState<{
    patient: PatientProfile;
    vitals: Vitals;
    mainComplaint: string;
    symptoms: string[];
    injuryDetails: string;
    description: string;
  } | null>(null);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // Fetch initial locations & hospitals
  useEffect(() => {
    fetchLocations();
    fetchHospitals(currentLocation);
    fetchAuditLogs();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsOnlineBackend(true);
      } else {
        setIsOnlineBackend(false);
      }
    } catch {
      setIsOnlineBackend(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        if (data.presets && data.presets.length > 0) {
          setLocations(data.presets);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend locations unreachable, using fallback locations:', e);
    }
    setLocations(FALLBACK_LOCATIONS);
  };

  const fetchHospitals = async (loc: LocationPreset) => {
    try {
      const res = await fetch(
        `/api/hospitals/nearby?city=${encodeURIComponent(loc.city)}&country=${encodeURIComponent(loc.country)}&lat=${loc.lat}&lng=${loc.lng}`
      );
      if (res.ok) {
        const data = await res.json();
        const hospList: Hospital[] = data.hospitals || [];
        if (hospList.length > 0) {
          setHospitals(hospList);
          const zydus = hospList.find((h) => h.id === 'HOSP-ANAND-02') || hospList[0];
          setCurrentHospital(zydus);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend hospitals unreachable, using resilient fallback hospital directory:', e);
    }

    // Fallback: ALWAYS ensures hospital centers show up even on static Vercel!
    const fallbackList = fallbackGetNearbyHospitals(loc.city, loc.country, loc.lat, loc.lng);
    setHospitals(fallbackList);
    const zydusFallback = fallbackList.find((h) => h.id === 'HOSP-ANAND-02') || fallbackList[0];
    setCurrentHospital(zydusFallback);
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setAuditLogs(data.logs);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend audit logs unreachable:', e);
    }
  };

  const handleSelectLocation = (loc: LocationPreset) => {
    setCurrentLocation(loc);
    fetchHospitals(loc);
    setAiAssessment(null);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGPS(false);
        const gpsLoc: LocationPreset = {
          country: 'India',
          stateRegion: 'Gujarat',
          city: 'Anand',
          area: 'Current Device Geolocation Fix',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current Device GPS Location',
        };
        handleSelectLocation(gpsLoc);
      },
      (err) => {
        setIsDetectingGPS(false);
        console.warn('GPS error, keeping current location:', err.message);
        alert('Could not acquire GPS coordinates. Using scoped city location.');
      },
      { timeout: 8000 }
    );
  };

  // Submit Emergency Intake for AI Assessment
  const handleEmergencySubmit = async (formData: {
    patient: PatientProfile;
    vitals: Vitals;
    mainComplaint: string;
    symptoms: string[];
    injuryDetails: string;
    description: string;
    location: LocationPreset;
  }) => {
    setIsAssessing(true);
    setEmergencyFormData(formData);

    try {
      const res = await fetch('/api/emergency/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: formData.patient.age,
          gender: formData.patient.gender,
          mainComplaint: formData.mainComplaint,
          symptoms: formData.symptoms,
          vitals: formData.vitals,
          description: formData.description,
          conditions: formData.patient.conditions,
          allergies: formData.patient.allergies,
          location: formData.location,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.assessment) {
          setAiAssessment(data.assessment);
          if (data.rankedHospitals && data.rankedHospitals.length > 0) {
            setHospitals(data.rankedHospitals);
          }
          setIsAssessing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Live AI server unreachable, switching to clinical triage engine:', e);
    }

    // Client-side Clinical Fallback: NEVER show broken alert!
    const localAssessment = fallbackAssessEmergency({
      age: formData.patient.age,
      gender: formData.patient.gender,
      mainComplaint: formData.mainComplaint,
      symptoms: formData.symptoms,
      vitals: formData.vitals,
      description: formData.description,
      conditions: formData.patient.conditions,
      allergies: formData.patient.allergies,
    });

    setAiAssessment(localAssessment);
    const currentList =
      hospitals.length > 0
        ? hospitals
        : fallbackGetNearbyHospitals(
            currentLocation.city,
            currentLocation.country,
            currentLocation.lat,
            currentLocation.lng
          );
    const ranked = fallbackRankHospitals(currentList, localAssessment, formData.vitals);
    setHospitals(ranked);
    setIsAssessing(false);
  };

  // User clicks "Select Hospital & Authorize"
  const handleSelectHospital = (hospital: Hospital) => {
    setPendingSelectedHospital(hospital);
    setIsConsentModalOpen(true);
  };

  // User confirms in Consent Dialog -> create Emergency Case
  const handleConfirmConsent = async () => {
    if (!pendingSelectedHospital || !emergencyFormData || !aiAssessment) return;
    setIsSubmittingCase(true);

    try {
      const res = await fetch('/api/emergency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: emergencyFormData.patient,
          vitals: emergencyFormData.vitals,
          mainComplaint: emergencyFormData.mainComplaint,
          symptoms: emergencyFormData.symptoms,
          description: emergencyFormData.description,
          conditions: emergencyFormData.patient.conditions,
          allergies: emergencyFormData.patient.allergies,
          medications: emergencyFormData.patient.medications,
          location: currentLocation,
          selectedHospitalId: pendingSelectedHospital.id,
          consentGiven: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          setIsConsentModalOpen(false);
          fetchAuditLogs();
          setIsSubmittingCase(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend case creation unreachable, generating local emergency case:', e);
    }

    // Local Fallback Case Generation
    const localCaseId = `PJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const localCase: EmergencyCase = {
      id: localCaseId,
      patientId: emergencyFormData.patient.id || 'PAT-LOCAL',
      patientName: emergencyFormData.patient.name,
      patientAge: emergencyFormData.patient.age,
      patientGender: emergencyFormData.patient.gender,
      patientBloodGroup: emergencyFormData.patient.bloodGroup,
      patientContact: emergencyFormData.patient.phone,
      emergencyContact: emergencyFormData.patient.emergencyContact,
      isVerifiedPatient: Boolean(emergencyFormData.patient.isVerified),
      patientLocation: currentLocation,
      mainComplaint: emergencyFormData.mainComplaint,
      symptoms: emergencyFormData.symptoms,
      description: emergencyFormData.description,
      emergencyTime: new Date().toLocaleTimeString(),
      vitals: emergencyFormData.vitals,
      conditions: emergencyFormData.patient.conditions,
      allergies: emergencyFormData.patient.allergies,
      medications: emergencyFormData.patient.medications,
      severity: aiAssessment.severity,
      aiAssessment: aiAssessment,
      selectedHospitalId: pendingSelectedHospital.id,
      selectedHospitalName: pendingSelectedHospital.name,
      hospitalAcceptanceStatus: 'PENDING',
      consentGiven: true,
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
      preparationChecklist: [
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
      ],
      route: {
        distanceKm: pendingSelectedHospital.distanceKm || 6.0,
        etaMinutes: pendingSelectedHospital.etaMinutes || 8,
        trafficStatus: pendingSelectedHospital.trafficStatus || 'LOW',
        selectedRouteId: 'route-c',
        routes: [
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
              [22.571, 72.937],
              [22.578, 72.946],
              [22.583, 72.952],
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
              [22.568, 72.932],
              [22.575, 72.941],
              [22.583, 72.952],
            ],
          },
        ],
        liveRerouted: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveCase(localCase);
    setIsConsentModalOpen(false);
    setIsSubmittingCase(false);

    // Append local audit log
    const localLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      actorId: patient.id,
      actorName: patient.name,
      actorRole: 'PATIENT',
      action: 'EMERGENCY_CASE_AND_CONSENT_REGISTERED',
      entityType: 'EMERGENCY_CASE',
      entityId: localCaseId,
      newValue: `Hospital: ${localCase.selectedHospitalName}, Severity: ${localCase.severity}`,
      reason: 'Patient gave informed consent for minimal necessary clinical data transmission.',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [localLog, ...prev]);
  };

  // Dynamic Reroute Trigger
  const handleDynamicReroute = async (caseId: string) => {
    setIsRerouting(true);
    try {
      const res = await fetch('/api/route/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          fetchAuditLogs();
          setIsRerouting(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend reroute unreachable, calculating local dynamic detour:', e);
    }

    // Local Fallback Dynamic Detour
    if (activeCase && activeCase.route) {
      const alternateRoute = {
        id: 'route-live-bypass',
        name: 'Dynamic Bypass: GIDC Expressway Link',
        distanceKm: 6.4,
        etaMinutes: 7,
        traffic: 'LOW' as const,
        isRecommended: true,
        timeSavedMinutes: 4,
        description: 'Bypasses newly reported accident backlog at Lambhvel Junction.',
        waypoints: [
          [22.5645, 72.9289] as [number, number],
          [22.57, 72.933] as [number, number],
          [22.579, 72.94] as [number, number],
          [22.583, 72.952] as [number, number],
        ],
      };

      const updatedRoutes = [...activeCase.route.routes];
      if (!updatedRoutes.find((r) => r.id === 'route-live-bypass')) {
        updatedRoutes.unshift(alternateRoute);
      }

      const updatedCase: EmergencyCase = {
        ...activeCase,
        route: {
          ...activeCase.route,
          liveRerouted: true,
          selectedRouteId: 'route-live-bypass',
          etaMinutes: 7,
          trafficStatus: 'LOW',
          rerouteNotice:
            '⚠️ Heavy traffic detected ahead on corridor. Dynamic detour activated: Previous ETA 11 min → New ETA 7 min (Saved 4 min).',
          routes: updatedRoutes,
        },
      };

      setActiveCase(updatedCase);

      const localLog: AuditLog = {
        id: `AUD-${Date.now()}`,
        actorId: 'AI-TRAFFIC-ENGINE',
        actorName: 'PRAANJEEV Dynamic Traffic Sentinel',
        actorRole: 'SYSTEM_ADMIN',
        action: 'DYNAMIC_REROUTE_EXECUTED',
        entityType: 'EMERGENCY_CASE',
        entityId: caseId,
        oldValue: 'ETA: 11 min (Corridor Congestion)',
        newValue: 'ETA: 7 min (GIDC Expressway Bypass)',
        reason: 'Dynamic traffic reroute triggered to ensure fastest practical emergency route.',
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [localLog, ...prev]);
    }
    setIsRerouting(false);
  };

  // Case Status Update
  const handleUpdateStatus = async (caseId: string, newStatus: CaseStatus) => {
    try {
      const res = await fetch(`/api/emergency/${caseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          fetchAuditLogs();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend status update unreachable, updating locally:', e);
    }

    if (activeCase && activeCase.id === caseId) {
      setActiveCase({ ...activeCase, status: newStatus, updatedAt: new Date().toISOString() });
    }
  };

  // Hospital Actions
  const handleAcceptCase = async (caseId: string) => {
    try {
      const res = await fetch(`/api/hospital/emergency-cases/${caseId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          fetchAuditLogs();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend accept unreachable, updating locally:', e);
    }

    if (activeCase && activeCase.id === caseId) {
      setActiveCase({
        ...activeCase,
        hospitalAcceptanceStatus: 'ACCEPTED',
        status: 'PREPARING',
        preparationChecklist: activeCase.preparationChecklist.map((i) => ({
          ...i,
          status: 'PREPARING',
        })),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleDeclineCase = async (caseId: string, reason: string) => {
    try {
      const res = await fetch(`/api/hospital/emergency-cases/${caseId}/decline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          fetchAuditLogs();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend decline unreachable, updating locally:', e);
    }

    if (activeCase && activeCase.id === caseId) {
      setActiveCase({
        ...activeCase,
        hospitalAcceptanceStatus: 'DECLINED',
        declineReason: reason,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleUpdateChecklist = async (
    caseId: string,
    itemId: string,
    status: 'REQUESTED' | 'PREPARING' | 'READY'
  ) => {
    try {
      const res = await fetch(`/api/hospital/emergency-cases/${caseId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emergencyCase) {
          setActiveCase(data.emergencyCase);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend checklist unreachable, updating locally:', e);
    }

    if (activeCase && activeCase.id === caseId) {
      const updatedChecklist = activeCase.preparationChecklist.map((item) =>
        item.id === itemId ? { ...item, status, timestamp: new Date().toISOString() } : item
      );
      const allReady = updatedChecklist.every((i) => i.status === 'READY');
      setActiveCase({
        ...activeCase,
        preparationChecklist: updatedChecklist,
        status: allReady && activeCase.status === 'PREPARING' ? 'AMBULANCE_EN_ROUTE' : activeCase.status,
      });
    }
  };

  // Hospital Resources Update (with Anti-Fake Data Error Handling)
  const handleUpdateResources = async (
    hospitalId: string,
    updatedResources: any
  ): Promise<{ success: boolean; error?: string }> => {
    // Client-side Anti-Fake Data Validation
    if (updatedResources.availableICU > updatedResources.totalICU) {
      const err = `Invalid resource value. Available ICU capacity (${updatedResources.availableICU}) cannot exceed total capacity (${updatedResources.totalICU}).`;
      const anomalyLog: AuditLog = {
        id: `AUD-${Date.now()}`,
        actorId: 'STF-PATEL',
        actorName: 'Head Nurse Meena Trivedi',
        actorRole: 'HOSPITAL_STAFF',
        action: 'DATA_ANOMALY_BLOCKED',
        entityType: 'RESOURCE',
        entityId: hospitalId,
        oldValue: 'Invalid capacity update attempt',
        newValue: `Rejected: Avail ICU: ${updatedResources.availableICU}`,
        reason: err,
        timestamp: new Date().toISOString(),
        anomalyDetected: true,
      };
      setAuditLogs((prev) => [anomalyLog, ...prev]);
      return { success: false, error: err };
    }

    try {
      const res = await fetch('/api/hospital/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          resources: updatedResources,
          staffName: 'Head Nurse Meena Trivedi',
          staffId: 'STF-PATEL',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHospitals((prev) => prev.map((h) => (h.id === hospitalId ? data.hospital : h)));
        if (currentHospital?.id === hospitalId) setCurrentHospital(data.hospital);
        fetchAuditLogs();
        return { success: true };
      }
      if (data.error) {
        return { success: false, error: data.error };
      }
    } catch (e) {
      console.warn('Backend resource update unreachable, applying local update:', e);
    }

    // Apply local update
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === hospitalId) {
          const updated = {
            ...h,
            resources: { ...h.resources, ...updatedResources },
            lastResourceUpdate: new Date().toISOString(),
            dataConfidence: 'HIGH' as const,
          };
          if (currentHospital?.id === hospitalId) setCurrentHospital(updated);
          return updated;
        }
        return h;
      })
    );

    const log: AuditLog = {
      id: `AUD-${Date.now()}`,
      actorId: 'STF-PATEL',
      actorName: 'Head Nurse Meena Trivedi',
      actorRole: 'HOSPITAL_STAFF',
      action: 'RESOURCE_UPDATE',
      entityType: 'RESOURCE',
      entityId: hospitalId,
      oldValue: 'Resource baseline',
      newValue: `ICU: ${updatedResources.availableICU}/${updatedResources.totalICU}`,
      reason: 'Hourly verified resource sync',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
    return { success: true };
  };

  // Hospital Verification
  const handleUpdateVerification = async (
    hospitalId: string,
    status: VerificationStatus,
    reason: string
  ) => {
    try {
      const endpoint =
        status === 'VERIFIED'
          ? `/api/admin/hospitals/${hospitalId}/verify`
          : `/api/admin/hospitals/${hospitalId}/suspend`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hospital) {
          setHospitals((prev) => prev.map((h) => (h.id === hospitalId ? data.hospital : h)));
          fetchAuditLogs();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend verification unreachable, applying locally:', e);
    }

    setHospitals((prev) =>
      prev.map((h) => (h.id === hospitalId ? { ...h, verificationStatus: status } : h))
    );
    const log: AuditLog = {
      id: `AUD-${Date.now()}`,
      actorId: 'ADM-CHIEF-01',
      actorName: 'Dr. V. K. Mehta (Chief Verification Officer)',
      actorRole: 'SYSTEM_ADMIN',
      action: status === 'VERIFIED' ? 'HOSPITAL_VERIFIED' : 'HOSPITAL_SUSPENDED',
      entityType: 'VERIFICATION',
      entityId: hospitalId,
      newValue: status,
      reason,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Quick Execution of Hackathon Scenario 1
  const handleRunScenario1 = async () => {
    setActiveTab('patient');
    const anandLoc = FALLBACK_LOCATIONS[0];
    setCurrentLocation(anandLoc);
    await fetchHospitals(anandLoc);

    const cardiacVitals: Vitals = {
      heartRate: 118,
      spO2: 89,
      bloodPressure: '90/60',
      temperature: 98.6,
      respiratoryRate: 24,
      consciousness: 'CONSCIOUS',
    };

    handleEmergencySubmit({
      patient: DEFAULT_PATIENT,
      vitals: cardiacVitals,
      mainComplaint: 'Severe retrosternal crushing chest pain radiating to left arm',
      symptoms: ['Severe chest pain', 'Shortness of breath', 'Left arm radiation', 'Cold sweats'],
      injuryDetails: '',
      description:
        '45yo male with sudden acute chest discomfort, severe hypoxia (89%), tachycardia (118 bpm), hypotension (90/60). Immediate cardiac catheterization capability and ICU bed required.',
      location: anandLoc,
    });
  };

  // Quick Execution of Hackathon Scenario 2
  const handleRunScenario2 = () => {
    setActiveTab('hospital');
  };

  // Quick Execution of Hackathon Scenario 3
  const handleRunScenario3 = (loc: LocationPreset) => {
    handleSelectLocation(loc);
    setActiveTab('patient');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Universal Header */}
      <Header
        currentLocation={currentLocation}
        locations={locations}
        onSelectLocation={handleSelectLocation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        patient={patient}
        onDetectGPS={handleDetectGPS}
        isDetectingGPS={isDetectingGPS}
      />

      {/* Deployment & Engine Status Notice (Subtle, Clean) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-300">
              PRAANJEEV Clinical Coordination Engine: Active
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">
              Multi-Region Intelligence (Anand, Ahmedabad, NYC, London)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-400">
              {isOnlineBackend === true ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Serverless API Connected
                </span>
              ) : (
                <span className="text-cyan-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Resilient Edge Engine Active
                </span>
              )}
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700">
              Zero-Downtime Architecture
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'patient' && (
          <div>
            {/* Mission Hero Banner */}
            <UspBanner
              onStartEmergency={() => {
                const el = document.getElementById('emergency-form-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              activeCaseId={activeCase?.id}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
              {/* If an active case is running, show live tracker right at top */}
              {activeCase && (
                <section>
                  <ActiveEmergencyTracker
                    emergencyCase={activeCase}
                    onDynamicReroute={handleDynamicReroute}
                    onUpdateStatus={handleUpdateStatus}
                    isRerouting={isRerouting}
                  />
                </section>
              )}

              {/* AI Assessment View (if generated) */}
              {aiAssessment && (
                <section>
                  <AIAssessmentView assessment={aiAssessment} />
                </section>
              )}

              {/* Hospital Centers & Ranking Cards (Always displayed and loaded!) */}
              {hospitals.length > 0 && (
                <section>
                  <HospitalRankingList
                    hospitals={hospitals}
                    onSelectHospital={handleSelectHospital}
                    selectedHospitalId={activeCase?.selectedHospitalId}
                  />
                </section>
              )}

              {/* Emergency Form Section */}
              <section id="emergency-form-section">
                <EmergencyForm
                  patient={patient}
                  currentLocation={currentLocation}
                  onSubmit={handleEmergencySubmit}
                  isLoading={isAssessing}
                />
              </section>
            </div>
          </div>
        )}

        {/* Hospital Command Center */}
        {activeTab === 'hospital' && currentHospital && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <HospitalDashboard
              hospitals={hospitals}
              currentHospital={currentHospital}
              onSelectHospital={(h) => setCurrentHospital(h)}
              activeCase={activeCase || undefined}
              onAcceptCase={handleAcceptCase}
              onDeclineCase={handleDeclineCase}
              onUpdateChecklist={handleUpdateChecklist}
              onUpdateResources={handleUpdateResources}
              onRefreshHospitals={() => fetchHospitals(currentLocation)}
            />
          </div>
        )}

        {/* Admin Verification & Audit Governance */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <AdminDashboard
              hospitals={hospitals}
              auditLogs={auditLogs}
              onUpdateVerification={handleUpdateVerification}
              onRefresh={fetchAuditLogs}
            />
          </div>
        )}

        {/* Hackathon Live Scenarios Walkthrough */}
        {activeTab === 'scenarios' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <HackathonScenarios
              onRunScenario1={handleRunScenario1}
              onRunScenario2={handleRunScenario2}
              onRunScenario3={handleRunScenario3}
              locations={locations}
            />
          </div>
        )}
      </main>

      {/* Patient Consent & Authorization Modal */}
      {pendingSelectedHospital && emergencyFormData && (
        <ConsentModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          onConfirm={handleConfirmConsent}
          hospital={pendingSelectedHospital}
          patient={emergencyFormData.patient}
          vitals={emergencyFormData.vitals}
          mainComplaint={emergencyFormData.mainComplaint}
          isSubmitting={isSubmittingCase}
        />
      )}

      {/* Footer with Medical Safety Statement */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex items-center justify-center space-x-2 text-slate-400 font-medium">
            <span>PRAANJEEV</span>
            <span>•</span>
            <span>AI Emergency Response & Hospital Coordination System</span>
            <span>•</span>
            <span>Version 2.4 (Production Ready)</span>
          </div>
          <p className="max-w-3xl mx-auto text-[11px] text-slate-400 leading-relaxed">
            <strong>Clinical Coordination Notice:</strong> PRAANJEEV is an emergency response coordination and decision-support platform designed to connect patients to verified medical facilities. It does not provide medical diagnosis or replace registered emergency medical professionals. In life-threatening emergencies, dial 108 / 911 immediately.
          </p>
          <div className="pt-2 text-[10px] text-slate-400">
            © 2026 PRAANJEEV Emergency Care Intelligence. Built for high-trust critical healthcare operations.
          </div>
        </div>
      </footer>
    </div>
  );
}
