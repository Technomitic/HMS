-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST', 'LAB_TECH', 'PHARMACIST');
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "department" AS ENUM ('CARDIOLOGY', 'ORTHOPEDICS', 'PEDIATRICS', 'NEUROLOGY', 'DERMATOLOGY', 'GENERAL_MEDICINE', 'EMERGENCY', 'RADIOLOGY', 'PATHOLOGY', 'OPHTHALMOLOGY');
CREATE TYPE "appointment_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "appointment_type" AS ENUM ('OPD', 'IPD', 'FOLLOW_UP', 'EMERGENCY');
CREATE TYPE "test_category" AS ENUM ('PATHOLOGY', 'RADIOLOGY', 'MICROBIOLOGY');
CREATE TYPE "lab_report_status" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'REJECTED');
CREATE TYPE "invoice_status" AS ENUM ('DRAFT', 'UNPAID', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'VOID');
CREATE TYPE "notification_channel" AS ENUM ('SMS', 'EMAIL', 'PUSH', 'IN_APP');

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PATIENT',
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateTable: patients
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "mrn" VARCHAR(20) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "gender" NOT NULL,
    "blood_group" VARCHAR(5),
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergency_name" VARCHAR(100),
    "emergency_phone" VARCHAR(20),
    "emergency_relation" VARCHAR(50),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "zip_code" VARCHAR(20),
    "country" VARCHAR(5) DEFAULT 'US',
    "insurance_provider" VARCHAR(200),
    "insurance_policy_no" VARCHAR(100),
    "consent_signed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");
CREATE INDEX "patients_mrn_idx" ON "patients"("mrn");

-- CreateTable: doctor_profiles
CREATE TABLE "doctor_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "department" "department" NOT NULL,
    "specialization" VARCHAR(200) NOT NULL,
    "license_number" VARCHAR(50) NOT NULL,
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "consultation_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "schedule" JSONB DEFAULT '{}',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "doctor_profiles_user_id_key" ON "doctor_profiles"("user_id");
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");
CREATE INDEX "doctor_profiles_department_idx" ON "doctor_profiles"("department");

-- CreateTable: appointments
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "department" "department" NOT NULL,
    "slot_start" TIMESTAMPTZ NOT NULL,
    "slot_end" TIMESTAMPTZ NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'SCHEDULED',
    "type" "appointment_type" NOT NULL DEFAULT 'OPD',
    "qr_code_hash" VARCHAR(64),
    "chief_complaint" TEXT,
    "notes" TEXT,
    "diagnosis" TEXT,
    "vitals" JSONB,
    "prescription" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointments_slot_check" CHECK ("slot_end" > "slot_start")
);
CREATE UNIQUE INDEX "appointments_qr_code_hash_key" ON "appointments"("qr_code_hash");
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");
CREATE INDEX "appointments_slot_start_idx" ON "appointments"("slot_start");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateTable: lab_reports
CREATE TABLE "lab_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "ordered_by" UUID NOT NULL,
    "test_type" VARCHAR(200) NOT NULL,
    "test_category" "test_category" NOT NULL,
    "status" "lab_report_status" NOT NULL DEFAULT 'ORDERED',
    "results" JSONB,
    "report_pdf_url" VARCHAR(500),
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lab_reports_patient_id_idx" ON "lab_reports"("patient_id");
CREATE INDEX "lab_reports_appointment_id_idx" ON "lab_reports"("appointment_id");
CREATE INDEX "lab_reports_status_idx" ON "lab_reports"("status");

-- CreateTable: invoices
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "tax_cents" INTEGER NOT NULL DEFAULT 0,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'UNPAID',
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "payment_method" VARCHAR(50),
    "pdf_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_patient_id_idx" ON "invoices"("patient_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID NOT NULL,
    "changes" JSONB,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- Foreign Keys
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT;
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT;
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_ordered_by_fkey" FOREIGN KEY ("ordered_by") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;

-- Row Level Security (prepare for future activation)
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lab_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;