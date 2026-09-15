export type UserRole = 'PATIENT' | 'HOSPITAL_STAFF' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'RE_VERIFICATION_REQUIRED';

export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type EmergencySeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MILD';

export type CaseStatus = 
  | 'AI_ASSESSED'
  | 'HOSPITAL_SELECTED'
  | 'HOSPITAL_NOTIFIED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'PREPARING'
  | 'AMBULANCE_EN_ROUTE'
  | 'ARRIVING_SOON'
  | 'PATIENT_ARRIVED'
  | 'TREATMENT_STARTED';

export interface Vitals {
  heartRate: number; // bpm
  spO2: number; // percentage
  bloodPressure: string; // e.g. "90/60"
  temperature: number; // Fahrenheit or Celsius
  respiratoryRate: number; // breaths/min
  consciousness: 'CONSCIOUS' | 'SEMI_CONSCIOUS' | 'UNCONSCIOUS';
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  isVerified: boolean;
  conditions: string[];
  allergies: string[];
  medications: string[];
  pastSurgeries: string[];
}

export interface HospitalResource {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  emergencyBeds: number;
  totalICU: number;
  availableICU: number;
  occupiedICU: number;
  ventilatorsAvailable: number;
  oxygenStatus: 'OPTIMAL' | 'MODERATE' | 'LOW' | 'CRITICAL';
  oxygenUnits: number; // Cylinders / bar
  cardiacCareAvailable: boolean;
  traumaCareAvailable: boolean;
  operationTheatreReady: boolean;
  ambulancesAvailable: number;
  emergencyDoctorsOnDuty: number;
  specialistsAvailable: string[];
}

export interface MedicineInventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumThreshold: number;
  expiryDate: string;
  status: 'AVAILABLE' | 'LOW' | 'CRITICAL';
  lastUpdated: string;
}

export interface BloodStock {
  group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  unitsAvailable: number;
  status: 'AVAILABLE' | 'LOW' | 'CRITICAL';
}

export interface Hospital {
  id: string;
  name: string;
  country: string;
  stateRegion: string;
  city: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  contactNumber: string;
  emergencyContact: string;
  officialEmail: string;
  is24x7: boolean;
  
  // Legal & Verification
  verificationStatus: VerificationStatus;
  registrationNumber: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  accreditation: string;
  authorizedPerson: {
    name: string;
    designation: string;
    contact: string;
    email: string;
  };

  // Resources & Freshness
  resources: HospitalResource;
  medicines: MedicineInventoryItem[];
  bloodStock: BloodStock[];
  lastResourceUpdate: string; // ISO string
  nextUpdateDue: string; // ISO string
  dataConfidence: DataConfidence;
  
  // Scoring metadata when matched
  score?: number;
  distanceKm?: number;
  etaMinutes?: number;
  trafficStatus?: 'LOW' | 'MEDIUM' | 'HEAVY';
  matchReason?: string;
  suitabilityRank?: number;
}

export interface PreparationChecklistItem {
  id: string;
  label: string;
  category: 'EQUIPMENT' | 'PERSONNEL' | 'PHARMACY' | 'FACILITY';
  status: 'REQUESTED' | 'PREPARING' | 'READY';
  assignedTo?: string;
  timestamp: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  traffic: 'LOW' | 'MEDIUM' | 'HEAVY';
  isRecommended: boolean;
  timeSavedMinutes?: number;
  description: string;
  waypoints: [number, number][]; // [lat, lng]
}

export interface EmergencyCase {
  id: string; // PJ-2026-XXXXXX
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup: string;
  patientContact: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  isVerifiedPatient: boolean;
  
  // Location
  patientLocation: {
    country: string;
    stateRegion: string;
    city: string;
    area: string;
    lat: number;
    lng: number;
    address: string;
  };

  // Emergency complaint
  mainComplaint: string;
  symptoms: string[];
  injuryDetails?: string;
  description: string;
  emergencyTime: string;

  // Vitals
  vitals: Vitals;

  // Medical info
  conditions: string[];
  allergies: string[];
  medications: string[];

  // AI Assessment (IBM BoB / Gemini Decision Support)
  severity: EmergencySeverity;
  aiAssessment: {
    severityScore: number; // 0 - 100
    summary: string;
    riskIndicators: string[];
    requiredCapabilities: string[];
    preAlertMessage: string;
    disclaimer: string;
  };

  // Hospital Matching & Selection
  selectedHospitalId?: string;
  selectedHospitalName?: string;
  hospitalAcceptanceStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  declineReason?: string;

  // Consent & Shared Data
  consentGiven: boolean;
  consentTimestamp?: string;
  sharedFields?: string[];

  // Preparation & Route
  status: CaseStatus;
  preparationChecklist: PreparationChecklistItem[];
  route?: {
    distanceKm: number;
    etaMinutes: number;
    trafficStatus: 'LOW' | 'MEDIUM' | 'HEAVY';
    selectedRouteId: string;
    routes: RouteOption[];
    liveRerouted?: boolean;
    rerouteNotice?: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'HOSPITAL' | 'RESOURCE' | 'EMERGENCY_CASE' | 'VERIFICATION' | 'MEDICINE';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
  anomalyDetected?: boolean;
}

export interface LocationPreset {
  country: string;
  stateRegion: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  label: string;
}
