// ========================================
// CORE ENUMS
// ========================================
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  RECEPTIONIST = 'receptionist',
  LAB_TECH = 'lab_tech',
  PHARMACIST = 'pharmacist',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum LabReportStatus {
  ORDERED = 'ordered',
  SAMPLE_COLLECTED = 'sample_collected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  VOID = 'void',
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum Department {
  CARDIOLOGY = 'cardiology',
  ORTHOPEDICS = 'orthopedics',
  PEDIATRICS = 'pediatrics',
  NEUROLOGY = 'neurology',
  DERMATOLOGY = 'dermatology',
  GENERAL = 'general_medicine',
  EMERGENCY = 'emergency',
  RADIOLOGY = 'radiology',
  PATHOLOGY = 'pathology',
  OPHTHALMOLOGY = 'ophthalmology',
}

// ========================================
// CORE INTERFACES
// ========================================
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Patient extends BaseEntity {
  userId: string;
  mrn: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies: string[];
  emergencyContact: EmergencyContact;
  address: Address;
  insuranceInfo?: InsuranceInfo;
  consentSigned: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expiryDate: string;
}

export interface DoctorProfile extends BaseEntity {
  userId: string;
  department: Department;
  specialization: string;
  licenseNumber: string;
  qualifications: string[];
  experience: number;
  consultationFee: number;
  bio?: string;
  availableSlots: WeeklySchedule;
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface Appointment extends BaseEntity {
  patientId: string;
  doctorId: string;
  department: Department;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  type: 'opd' | 'ipd' | 'follow_up' | 'emergency';
  qrCodeHash?: string;
  notes?: string;
  chiefComplaint?: string;
  vitals?: Vitals;
  diagnosis?: string;
  prescription?: PrescriptionItem[];
}

export interface Vitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

export interface PrescriptionItem {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface LabReport extends BaseEntity {
  appointmentId: string;
  patientId: string;
  orderedBy: string;
  testType: string;
  testCategory: 'pathology' | 'radiology' | 'microbiology';
  status: LabReportStatus;
  results?: Record<string, LabResult>;
  reportPdfUrl?: string;
  notes?: string;
  completedAt?: string;
}

export interface LabResult {
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface Invoice extends BaseEntity {
  appointmentId: string;
  patientId: string;
  invoiceNumber: string;
  items: BillingItem[];
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  pdfUrl?: string;
}

export interface BillingItem {
  description: string;
  category: 'consultation' | 'lab' | 'radiology' | 'pharmacy' | 'room' | 'procedure' | 'other';
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface Notification extends BaseEntity {
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  sentAt?: string;
  deliveredAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ========================================
// API RESPONSE TYPES
// ========================================
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ========================================
// DASHBOARD TYPES
// ========================================
export interface AdminDashboardStats {
  todayAppointments: number;
  totalPatients: number;
  todayRevenueCents: number;
  pendingLabReports: number;
  activeIPD: number;
  occupancyRate: number;
  appointmentsByDepartment: Record<string, number>;
  revenueByDay: { date: string; amountCents: number }[];
  recentActivity: ActivityItem[];
}

export interface DoctorDashboardStats {
  todayAppointments: number;
  pendingReviews: number;
  totalPatientsThisWeek: number;
  completedToday: number;
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
}

export interface PatientDashboardStats {
  upcomingAppointments: Appointment[];
  recentLabReports: LabReport[];
  pendingInvoices: Invoice[];
  prescriptions: PrescriptionItem[];
  nextAppointment?: Appointment;
}

export interface ActivityItem {
  id: string;
  message: string;
  type: 'appointment' | 'lab' | 'billing' | 'discharge' | 'registration';
  timestamp: string;
  userId: string;
  userName: string;
}