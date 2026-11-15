--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path TO public, pg_catalog;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abdm_consents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.abdm_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    clinic_id uuid,
    consent_artefact_id character varying(150) NOT NULL,
    purpose character varying(100) DEFAULT 'CAREMGT'::character varying NOT NULL,
    abha_address character varying(150) NOT NULL,
    hi_types jsonb DEFAULT '["Prescription", "DiagnosticReport", "OPConsultation"]'::jsonb,
    date_from timestamp with time zone NOT NULL,
    date_to timestamp with time zone NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    status character varying(50) DEFAULT 'GRANTED'::character varying,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: abdm_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.abdm_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid,
    hip_id character varying(100) NOT NULL,
    hiu_id character varying(100) NOT NULL,
    client_id character varying(200),
    client_secret character varying(200),
    sandbox_mode boolean DEFAULT true,
    is_enabled boolean DEFAULT true,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    public_key text,
    last_sync_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: ai_consultation_drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_consultation_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    doctor_id uuid,
    patient_id uuid,
    raw_input_notes text,
    structured_soap jsonb DEFAULT '{}'::jsonb NOT NULL,
    missing_fields jsonb DEFAULT '[]'::jsonb,
    differential_diagnoses jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'DRAFT'::character varying,
    is_ai_generated boolean DEFAULT true,
    approved_at timestamp with time zone,
    approved_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: ai_lab_report_extractions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_lab_report_extractions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    clinic_id uuid,
    document_url text,
    file_name character varying(255),
    source_lab character varying(100),
    report_date date DEFAULT CURRENT_DATE,
    raw_ocr_text text,
    extracted_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    overall_confidence numeric(5,2) DEFAULT 95.00,
    status character varying(50) DEFAULT 'PENDING_REVIEW'::character varying,
    verified_by_user_id uuid,
    verified_at timestamp with time zone,
    doctor_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);



--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    appointment_date date NOT NULL,
    appointment_time character varying(8) NOT NULL,
    duration_minutes integer NOT NULL,
    status character varying(32) NOT NULL,
    appointment_source character varying(32) NOT NULL,
    appointment_notes text,
    cancellation_reason text,
    checked_in_at timestamp with time zone,
    completed_at timestamp with time zone,
    consultation_fee numeric(10,2) NOT NULL,
    created_by_user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_teleconsultation boolean DEFAULT false
);



--
-- Name: COLUMN appointments.appointment_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.appointments.appointment_date IS 'Calendar date of appointment';


--
-- Name: COLUMN appointments.appointment_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.appointments.appointment_time IS 'Start time in 24-hr format e.g. 10:30';


--
-- Name: COLUMN appointments.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.appointments.status IS 'SCHEDULED, CONFIRMED, CHECKED_IN, CANCELLED, COMPLETED, NO_SHOW';


--
-- Name: COLUMN appointments.appointment_source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.appointments.appointment_source IS 'ONLINE, WALK_IN, PHONE';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    actor_user_id uuid,
    clinic_id uuid,
    action character varying(64) NOT NULL,
    resource_type character varying(64) NOT NULL,
    resource_id character varying(64),
    request_id character varying(64),
    ip_address character varying(45),
    details json,
    created_at timestamp without time zone NOT NULL
);



--
-- Name: automation_job_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_job_logs (
    id uuid NOT NULL,
    job_type character varying(100) NOT NULL,
    clinic_id uuid,
    recipient_user_id uuid,
    appointment_id uuid,
    queue_entry_id uuid,
    channel character varying(50) DEFAULT 'PUSH'::character varying,
    status character varying(50) DEFAULT 'SENT'::character varying,
    error_message text,
    idempotency_key character varying(128),
    payload json,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: automation_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_settings (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    reminders_enabled boolean DEFAULT true,
    reminder_intervals_hours integer[] DEFAULT '{24,2,0}'::integer[],
    queue_alerts_enabled boolean DEFAULT true,
    turn_approaching_threshold integer DEFAULT 2,
    delay_alerts_enabled boolean DEFAULT true,
    delay_threshold_minutes integer DEFAULT 15,
    traffic_departure_enabled boolean DEFAULT true,
    default_arrival_buffer_minutes integer DEFAULT 10,
    google_maps_cache_ttl_minutes integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: billing_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_profiles (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    legal_business_name character varying(255) NOT NULL,
    gstin character varying(20),
    pan character varying(10),
    billing_address text NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_phone character varying(20) NOT NULL,
    place_of_supply character varying(100) DEFAULT 'Karnataka (29)'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: clinic_branch_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_branch_schedules (
    id uuid NOT NULL,
    branch_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    opening_time character varying(8) NOT NULL,
    closing_time character varying(8) NOT NULL,
    break_start_time character varying(8),
    break_end_time character varying(8),
    is_closed boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN clinic_branch_schedules.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_branch_schedules.day_of_week IS '0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday';


--
-- Name: clinic_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_branches (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    name character varying(160) NOT NULL,
    is_main_branch boolean NOT NULL,
    phone character varying(20),
    email character varying(255),
    address text,
    city character varying(64),
    state character varying(64),
    postal_code character varying(16),
    latitude numeric(10,7),
    longitude numeric(10,7),
    operating_status character varying(32) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN clinic_branches.operating_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_branches.operating_status IS 'ACTIVE, INACTIVE, TEMPORARILY_CLOSED';


--
-- Name: clinic_correction_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_correction_requests (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    admin_user_id uuid,
    field_name character varying(64),
    comments text NOT NULL,
    status character varying(32) NOT NULL,
    resolution_notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN clinic_correction_requests.field_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_correction_requests.field_name IS 'e.g. registration_number, document_establishment, address';


--
-- Name: COLUMN clinic_correction_requests.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_correction_requests.status IS 'PENDING, RESOLVED';


--
-- Name: clinic_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_documents (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    document_type character varying(64) NOT NULL,
    file_name character varying(255) NOT NULL,
    storage_path character varying(512) NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(128) NOT NULL,
    uploaded_by_user_id uuid,
    verification_status character varying(32) NOT NULL,
    rejection_reason text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN clinic_documents.document_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_documents.document_type IS 'REGISTRATION_CERTIFICATE, ESTABLISHMENT_LICENSE, TAX_ID, POLLUTION_CONTROL_NOC, OTHER';


--
-- Name: COLUMN clinic_documents.file_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_documents.file_size IS 'File size in bytes';


--
-- Name: COLUMN clinic_documents.verification_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_documents.verification_status IS 'PENDING, VERIFIED, REJECTED';


--
-- Name: clinic_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_memberships (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    status character varying(24) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN clinic_memberships.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinic_memberships.status IS 'ACTIVE, INACTIVE, SUSPENDED';


--
-- Name: clinic_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_subscriptions (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(30) DEFAULT 'TRIALING'::character varying NOT NULL,
    billing_interval character varying(20) DEFAULT 'MONTHLY'::character varying NOT NULL,
    trial_start_at timestamp with time zone,
    trial_end_at timestamp with time zone,
    current_period_start timestamp with time zone DEFAULT now() NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    next_billing_at timestamp with time zone,
    grace_period_ends_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    gateway_subscription_id character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: clinic_verification_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_verification_history (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    admin_user_id uuid,
    from_status character varying(32) NOT NULL,
    to_status character varying(32) NOT NULL,
    reason text,
    admin_notes text,
    created_at timestamp without time zone NOT NULL
);



--
-- Name: clinics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinics (
    id uuid NOT NULL,
    name character varying(160) NOT NULL,
    slug character varying(160) NOT NULL,
    clinic_type character varying(32) NOT NULL,
    registration_number character varying(64),
    email character varying(255),
    phone character varying(20),
    address text,
    city character varying(64),
    state character varying(64),
    postal_code character varying(16),
    latitude numeric(10,7),
    longitude numeric(10,7),
    verification_status character varying(32) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    website character varying(255),
    established_year integer,
    rejection_reason text,
    suspension_reason text
);



--
-- Name: COLUMN clinics.clinic_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinics.clinic_type IS 'GENERAL, SPECIALIST, POLYCLINIC, DENTAL, PEDIATRIC, etc.';


--
-- Name: COLUMN clinics.registration_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinics.registration_number IS 'Clinical Establishments Act / State registration license';


--
-- Name: COLUMN clinics.verification_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinics.verification_status IS 'DRAFT, SUBMITTED, UNDER_REVIEW, NEEDS_CORRECTION, APPROVED, REJECTED, SUSPENDED';


--
-- Name: consultation_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultation_notes (
    id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    symptoms text,
    clinical_notes text,
    diagnosis_summary text,
    follow_up_date date,
    follow_up_notes text,
    is_draft boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    chief_complaints text,
    examination_findings text,
    treatment_plan text,
    advice_and_precautions text,
    vital_signs text
);



--
-- Name: COLUMN consultation_notes.vital_signs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.consultation_notes.vital_signs IS 'JSON encoded vital signs';


--
-- Name: delay_event_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delay_event_logs (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid,
    doctor_id uuid NOT NULL,
    queue_session_id uuid,
    delay_minutes integer NOT NULL,
    reason text,
    affected_patient_count integer DEFAULT 0,
    recorded_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: departure_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departure_recommendations (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    queue_entry_id uuid,
    clinic_id uuid NOT NULL,
    branch_id uuid,
    doctor_id uuid,
    origin_latitude numeric(10,6),
    origin_longitude numeric(10,6),
    origin_address text,
    destination_latitude numeric(10,6),
    destination_longitude numeric(10,6),
    expected_turn_at timestamp with time zone NOT NULL,
    estimated_travel_seconds integer NOT NULL,
    estimated_travel_text character varying(100),
    traffic_duration_seconds integer,
    traffic_status character varying(50) DEFAULT 'NORMAL'::character varying,
    distance_meters integer,
    distance_text character varying(100),
    arrival_buffer_seconds integer DEFAULT 600,
    recommended_departure_at timestamp with time zone NOT NULL,
    estimation_confidence character varying(20) DEFAULT 'HIGH'::character varying,
    recommendation_status character varying(50) DEFAULT 'READY'::character varying,
    route_polyline text,
    traffic_retrieved_at timestamp with time zone,
    queue_estimated_at timestamp with time zone,
    calculated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: diagnostic_lab_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diagnostic_lab_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_reference character varying(100) NOT NULL,
    clinic_id uuid,
    patient_id uuid,
    doctor_id uuid,
    laboratory_id uuid,
    appointment_id uuid,
    test_codes jsonb DEFAULT '[]'::jsonb NOT NULL,
    sample_collection_type character varying(50) DEFAULT 'CLINIC_WALKIN'::character varying,
    sample_barcode character varying(100),
    status character varying(50) DEFAULT 'ORDER_PLACED'::character varying,
    report_url text,
    report_received_at timestamp with time zone,
    external_order_id character varying(100),
    webhook_events jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: diagnostic_laboratories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diagnostic_laboratories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    integration_type character varying(50) DEFAULT 'WEBHOOK'::character varying,
    api_endpoint text,
    webhook_secret character varying(255),
    catalog jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: doctor_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_credentials (
    id uuid NOT NULL,
    doctor_profile_id uuid NOT NULL,
    credential_type character varying(64) NOT NULL,
    file_name character varying(255) NOT NULL,
    storage_path character varying(512) NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(128) NOT NULL,
    verification_status character varying(32) NOT NULL,
    created_at timestamp without time zone NOT NULL
);



--
-- Name: COLUMN doctor_credentials.credential_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_credentials.credential_type IS 'DEGREE_CERTIFICATE, COUNCIL_REGISTRATION, IDENTITY_PROOF, OTHER';


--
-- Name: COLUMN doctor_credentials.verification_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_credentials.verification_status IS 'PENDING, VERIFIED, REJECTED';


--
-- Name: doctor_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    primary_branch_id uuid,
    qualification character varying(160) NOT NULL,
    specialty character varying(100) NOT NULL,
    medical_registration_number character varying(64) NOT NULL,
    registration_council character varying(160) NOT NULL,
    experience_years integer NOT NULL,
    consultation_fee numeric(10,2) NOT NULL,
    consultation_duration_minutes integer NOT NULL,
    verification_status character varying(32) NOT NULL,
    rejection_reason text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN doctor_profiles.qualification; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_profiles.qualification IS 'e.g. MBBS, MD (General Medicine)';


--
-- Name: COLUMN doctor_profiles.specialty; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_profiles.specialty IS 'e.g. General Medicine, Pediatrics, Cardiology';


--
-- Name: COLUMN doctor_profiles.medical_registration_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_profiles.medical_registration_number IS 'Official registration license number';


--
-- Name: COLUMN doctor_profiles.registration_council; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_profiles.registration_council IS 'e.g. Karnataka Medical Council, NMC';


--
-- Name: COLUMN doctor_profiles.verification_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_profiles.verification_status IS 'PENDING, UNDER_REVIEW, APPROVED, NEEDS_CORRECTION, REJECTED, SUSPENDED';


--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_schedules (
    id uuid NOT NULL,
    doctor_profile_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time character varying(8) NOT NULL,
    end_time character varying(8) NOT NULL,
    is_available boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    break_start_time character varying(8),
    break_end_time character varying(8)
);



--
-- Name: COLUMN doctor_schedules.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.doctor_schedules.day_of_week IS '0=Monday, 6=Sunday';


--
-- Name: doctor_verification_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_verification_history (
    id uuid NOT NULL,
    doctor_profile_id uuid NOT NULL,
    admin_user_id uuid,
    from_status character varying(32) NOT NULL,
    to_status character varying(32) NOT NULL,
    reason text,
    admin_notes text,
    created_at timestamp without time zone NOT NULL
);



--
-- Name: follow_up_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follow_up_records (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    appointment_id uuid,
    prescription_id uuid,
    follow_up_date date NOT NULL,
    instructions text,
    status character varying(32) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: healthcare_provider_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.healthcare_provider_profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider_type character varying(50) NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    phone_number character varying(20) NOT NULL,
    qualification character varying(150) NOT NULL,
    specialty character varying(100),
    experience_years integer DEFAULT 1,
    registration_number character varying(100),
    registration_council character varying(150),
    languages jsonb DEFAULT '["English", "Hindi", "Kannada"]'::jsonb,
    bio text,
    profile_photo_url character varying(255),
    verification_status character varying(30) DEFAULT 'SUBMITTED'::character varying NOT NULL,
    verification_notes text,
    verified_at timestamp with time zone,
    verified_by_user_id uuid,
    associated_clinic_id uuid,
    is_independent boolean DEFAULT true,
    rating_avg numeric(3,2) DEFAULT 0.00,
    rating_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: healthcare_service_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.healthcare_service_categories (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    icon_name character varying(50) DEFAULT 'Home'::character varying,
    is_clinical_procedure boolean DEFAULT false,
    display_order integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: healthcare_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.healthcare_services (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    default_duration_minutes integer DEFAULT 45 NOT NULL,
    base_price numeric(10,2) DEFAULT 500.00 NOT NULL,
    required_qualification_type character varying(100),
    service_scope_notes text,
    sac_code character varying(20) DEFAULT '999312'::character varying,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: home_visit_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_visit_bookings (
    id uuid NOT NULL,
    booking_reference character varying(50) NOT NULL,
    patient_id uuid NOT NULL,
    booked_by_user_id uuid,
    provider_id uuid,
    service_id uuid NOT NULL,
    service_category_id uuid NOT NULL,
    clinic_id uuid,
    assignment_type character varying(30) DEFAULT 'PATIENT_SELECTED'::character varying NOT NULL,
    status character varying(30) DEFAULT 'REQUESTED'::character varying NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_start_time character varying(8) NOT NULL,
    scheduled_end_time character varying(8) NOT NULL,
    estimated_travel_minutes integer DEFAULT 20,
    estimated_travel_distance_km numeric(5,2) DEFAULT 5.00,
    service_address text NOT NULL,
    city character varying(100) DEFAULT 'Bengaluru'::character varying NOT NULL,
    postal_code character varying(10) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    contact_phone character varying(20) NOT NULL,
    patient_notes text,
    service_price numeric(10,2) NOT NULL,
    travel_charge numeric(10,2) DEFAULT 0.00 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    payment_status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    payment_method character varying(30) DEFAULT 'RAZORPAY'::character varying,
    gateway_order_id character varying(100),
    gateway_payment_id character varying(100),
    commission_rate_pct numeric(5,2) DEFAULT 15.00,
    platform_commission_amount numeric(10,2) DEFAULT 0.00,
    provider_payable_amount numeric(10,2) DEFAULT 0.00,
    payout_status character varying(30) DEFAULT 'PENDING'::character varying,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: home_visit_service_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_visit_service_records (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    clinical_observations text,
    vitals jsonb DEFAULT '{}'::jsonb,
    procedure_notes text,
    checklist_completed jsonb DEFAULT '[]'::jsonb,
    follow_up_recommendation text,
    specimen_identifiers jsonb DEFAULT '[]'::jsonb,
    prescription_id uuid,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: home_visit_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_visit_status_history (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    from_status character varying(30),
    to_status character varying(30) NOT NULL,
    changed_by_user_id uuid,
    reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: medical_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_documents (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid,
    uploaded_by_user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    document_type character varying(64) NOT NULL,
    original_filename character varying(255) NOT NULL,
    storage_path character varying(255) NOT NULL,
    file_size_bytes integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    document_date date NOT NULL,
    issuing_facility character varying(160),
    notes text,
    is_archived boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: medical_record_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_record_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    share_token character varying(120) NOT NULL,
    recipient_name character varying(150),
    recipient_email_or_phone character varying(150),
    shared_records jsonb DEFAULT '["PRESCRIPTION", "LAB_REPORT", "CLINICAL_NOTE"]'::jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    access_count integer DEFAULT 0,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    appointment_reminders boolean DEFAULT true,
    queue_notifications boolean DEFAULT true,
    departure_recommendations boolean DEFAULT true,
    delay_alerts boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT true,
    whatsapp_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verifications (
    id uuid NOT NULL,
    phone_number character varying(20) NOT NULL,
    otp_hash character varying(128) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    resend_available_at timestamp with time zone NOT NULL,
    attempt_count integer NOT NULL,
    max_attempts integer NOT NULL,
    is_verified boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN otp_verifications.phone_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.otp_verifications.phone_number IS 'Normalized E.164 destination number';


--
-- Name: COLUMN otp_verifications.otp_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.otp_verifications.otp_hash IS 'Salted SHA-256 hash of OTP code';


--
-- Name: patient_medical_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_medical_profiles (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    blood_group character varying(10),
    allergies text,
    existing_conditions text,
    past_medical_history text,
    surgical_history text,
    family_medical_history text,
    current_medications text,
    source character varying(32) NOT NULL,
    last_reviewed_by_doctor_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    user_id uuid,
    full_name character varying(160) NOT NULL,
    phone_number character varying(20) NOT NULL,
    email character varying(255),
    date_of_birth date,
    gender character varying(20),
    blood_group character varying(10),
    address text,
    city character varying(64),
    emergency_contact_name character varying(128),
    emergency_contact_phone character varying(20),
    allergies text,
    medical_history_summary text,
    registered_by_user_id uuid,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN patients.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.user_id IS 'Optional link to global platform User account';


--
-- Name: COLUMN patients.phone_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.phone_number IS 'Normalized E.164 phone number e.g. +919876543210';


--
-- Name: COLUMN patients.gender; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.gender IS 'MALE, FEMALE, OTHER';


--
-- Name: COLUMN patients.blood_group; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.blood_group IS 'e.g. A+, B+, O+, AB+, O-';


--
-- Name: COLUMN patients.registered_by_user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.registered_by_user_id IS 'Staff member who registered the patient';


--
-- Name: payment_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_adjustments (
    id uuid NOT NULL,
    payment_record_id uuid NOT NULL,
    adjustment_type character varying(32) NOT NULL,
    adjustment_amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    authorized_by_user_id uuid,
    created_at timestamp without time zone NOT NULL
);



--
-- Name: COLUMN payment_adjustments.adjustment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_adjustments.adjustment_type IS 'REFUND, DISCOUNT_CORRECTION, WRITE_OFF';


--
-- Name: payment_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_records (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    appointment_id uuid,
    patient_id uuid NOT NULL,
    receipt_number character varying(64) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(32) NOT NULL,
    payment_status character varying(32) NOT NULL,
    payment_reference character varying(128),
    notes text,
    recorded_by_user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN payment_records.receipt_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_records.receipt_number IS 'Sequential readable receipt ID e.g. RCP-202611-0001';


--
-- Name: COLUMN payment_records.payment_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_records.payment_method IS 'CASH, UPI, CARD, OTHER';


--
-- Name: COLUMN payment_records.payment_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_records.payment_status IS 'PENDING, COMPLETED, REFUNDED, ADJUSTED';


--
-- Name: COLUMN payment_records.payment_reference; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_records.payment_reference IS 'UPI transaction ID / UTR or Card Auth code';


--
-- Name: payment_webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_webhook_events (
    id uuid NOT NULL,
    gateway character varying(30) DEFAULT 'RAZORPAY'::character varying,
    event_id character varying(100) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    status character varying(20) DEFAULT 'PROCESSED'::character varying,
    processed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    code character varying(64) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN permissions.code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.permissions.code IS 'e.g. clinic.view, staff.manage, prescription.publish';


--
-- Name: pharmacy_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacy_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_reference character varying(100) NOT NULL,
    prescription_id uuid,
    pharmacy_id uuid,
    patient_id uuid,
    clinic_id uuid,
    doctor_id uuid,
    status character varying(50) DEFAULT 'TRANSMITTED'::character varying,
    delivery_type character varying(50) DEFAULT 'HOME_DELIVERY'::character varying,
    delivery_address jsonb,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_amount numeric(10,2) DEFAULT 0.00,
    external_order_id character varying(100),
    tracking_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: pharmacy_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacy_partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    api_endpoint text,
    webhook_secret character varying(255),
    is_active boolean DEFAULT true,
    catalog_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: platform_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(50) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    is_enabled boolean DEFAULT true,
    status character varying(50) DEFAULT 'HEALTHY'::character varying,
    sync_interval_minutes integer DEFAULT 60,
    last_sync_at timestamp with time zone DEFAULT now(),
    failed_sync_count integer DEFAULT 0,
    config_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: prescription_medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription_medications (
    id uuid NOT NULL,
    prescription_version_id uuid NOT NULL,
    medicine_name character varying(160) NOT NULL,
    generic_name character varying(160),
    brand_name character varying(160),
    strength character varying(64),
    dosage character varying(64),
    route character varying(64) NOT NULL,
    frequency character varying(64) NOT NULL,
    duration character varying(64) NOT NULL,
    quantity character varying(32),
    timing_instructions character varying(100),
    food_instructions character varying(64) NOT NULL,
    additional_instructions text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: prescription_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription_versions (
    id uuid NOT NULL,
    prescription_id uuid NOT NULL,
    version_number integer NOT NULL,
    chief_complaints text,
    clinical_history text,
    examination_findings text,
    diagnosis text,
    diagnosis_type character varying(32) NOT NULL,
    clinical_assessment text,
    treatment_plan text,
    advice_and_precautions text,
    follow_up_instructions text,
    follow_up_date date,
    correction_reason text,
    finalized_by_user_id uuid,
    finalized_at timestamp with time zone,
    pdf_storage_key character varying(255),
    document_checksum character varying(64),
    verification_token character varying(64),
    is_latest boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescriptions (
    id uuid NOT NULL,
    prescription_number character varying(32) NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    consultation_id uuid,
    current_version_id uuid,
    status character varying(32) NOT NULL,
    finalized_at timestamp with time zone,
    published_at timestamp with time zone,
    voided_at timestamp with time zone,
    void_reason text,
    voided_by_user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: provider_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_availability (
    id uuid NOT NULL,
    provider_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time character varying(8) DEFAULT '09:00'::character varying NOT NULL,
    end_time character varying(8) DEFAULT '18:00'::character varying NOT NULL,
    max_daily_visits integer DEFAULT 6,
    buffer_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: provider_complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_complaints (
    id uuid NOT NULL,
    booking_id uuid,
    reporter_user_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    complaint_type character varying(100) NOT NULL,
    description text NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying,
    resolution_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: provider_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_credentials (
    id uuid NOT NULL,
    provider_id uuid NOT NULL,
    credential_type character varying(100) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255),
    file_size integer,
    verification_status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    verification_notes text,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: provider_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_reviews (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    rating integer NOT NULL,
    punctuality_rating integer,
    review_text text,
    is_verified_visit boolean DEFAULT true,
    is_moderated boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT provider_reviews_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5))),
    CONSTRAINT provider_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);



--
-- Name: provider_service_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_service_areas (
    id uuid NOT NULL,
    provider_id uuid NOT NULL,
    city character varying(100) NOT NULL,
    locality character varying(100),
    postal_code character varying(10),
    service_radius_km numeric(5,2) DEFAULT 10.00,
    base_latitude numeric(10,7) DEFAULT 12.9716,
    base_longitude numeric(10,7) DEFAULT 77.5946,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: provider_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_services (
    id uuid NOT NULL,
    provider_id uuid NOT NULL,
    service_id uuid NOT NULL,
    custom_price numeric(10,2),
    is_offered boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: queue_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_entries (
    id uuid NOT NULL,
    queue_session_id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    token_number character varying(16) NOT NULL,
    token_sequence integer NOT NULL,
    booking_source character varying(32) NOT NULL,
    queue_status character varying(32) NOT NULL,
    priority_flag boolean NOT NULL,
    priority_reason text,
    priority_assigned_by_id uuid,
    estimated_wait_minutes integer NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    called_at timestamp with time zone,
    consultation_started_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_by_user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN queue_entries.token_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queue_entries.token_number IS 'Human-readable token number e.g. A001';


--
-- Name: COLUMN queue_entries.token_sequence; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queue_entries.token_sequence IS 'Numeric ordering sequence for daily queue';


--
-- Name: COLUMN queue_entries.booking_source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queue_entries.booking_source IS 'FIXED_SLOT, LIVE_QUEUE, WALK_IN';


--
-- Name: COLUMN queue_entries.queue_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queue_entries.queue_status IS 'WAITING, CALLED, IN_CONSULTATION, COMPLETED, SKIPPED, CANCELLED, NO_SHOW, ON_HOLD';


--
-- Name: queue_pause_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_pause_history (
    id uuid NOT NULL,
    queue_session_id uuid NOT NULL,
    actor_user_id uuid,
    pause_reason text,
    paused_at timestamp with time zone NOT NULL,
    resumed_at timestamp with time zone
);



--
-- Name: queue_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_policies (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid,
    doctor_id uuid,
    allow_live_queue boolean NOT NULL,
    allow_walk_ins boolean NOT NULL,
    max_daily_capacity integer NOT NULL,
    avg_consultation_minutes integer NOT NULL,
    grace_period_minutes integer NOT NULL,
    auto_call_next boolean NOT NULL,
    min_advance_booking_hours integer NOT NULL,
    max_advance_booking_days integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: queue_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_sessions (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    session_date date NOT NULL,
    is_active boolean NOT NULL,
    is_paused boolean NOT NULL,
    pause_reason text,
    paused_at timestamp with time zone,
    started_at timestamp with time zone,
    closed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN queue_sessions.session_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queue_sessions.session_date IS 'Operational queue calendar date';


--
-- Name: queue_state_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_state_history (
    id uuid NOT NULL,
    queue_entry_id uuid NOT NULL,
    actor_user_id uuid,
    from_status character varying(32) NOT NULL,
    to_status character varying(32) NOT NULL,
    reason text,
    created_at timestamp with time zone NOT NULL
);



--
-- Name: queue_token_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_token_counters (
    id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    counter_date date NOT NULL,
    prefix character varying(4) NOT NULL,
    current_counter integer NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: record_access_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.record_access_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    share_id uuid,
    ip_address character varying(100),
    user_agent text,
    record_types_accessed jsonb DEFAULT '[]'::jsonb,
    accessed_at timestamp with time zone DEFAULT now()
);



--
-- Name: record_sharing_consents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.record_sharing_consents (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    grantee_identifier character varying(160) NOT NULL,
    permitted_categories character varying(255) NOT NULL,
    access_duration_hours integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean NOT NULL,
    revoked_at timestamp with time zone,
    consent_token character varying(64) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(32) NOT NULL,
    description text,
    is_system_role boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN roles.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.name IS 'SUPER_ADMIN, CLINIC_OWNER, DOCTOR, RECEPTIONIST, PATIENT, HEALTHCARE_PROVIDER';


--
-- Name: subscription_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_audit_logs (
    id uuid NOT NULL,
    clinic_id uuid,
    subscription_id uuid,
    actor_user_id uuid,
    action character varying(100) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: subscription_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_invoices (
    id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    subscription_id uuid,
    payment_id uuid,
    clinic_id uuid NOT NULL,
    clinic_billing_name character varying(255) NOT NULL,
    clinic_billing_address text,
    clinic_gstin character varying(20),
    platform_legal_name character varying(255) DEFAULT 'Smart Clinic OS Technologies Pvt Ltd'::character varying NOT NULL,
    platform_gstin character varying(20) DEFAULT '29AABCS1429B1Z8'::character varying,
    plan_name character varying(100) NOT NULL,
    billing_period_start timestamp with time zone NOT NULL,
    billing_period_end timestamp with time zone NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT 18.00,
    tax_type character varying(10) DEFAULT 'IGST'::character varying,
    tax_amount numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    status character varying(20) DEFAULT 'PAID'::character varying,
    pdf_file_path character varying(255),
    finalized_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_payments (
    id uuid NOT NULL,
    subscription_id uuid,
    clinic_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    payment_gateway character varying(30) DEFAULT 'RAZORPAY'::character varying,
    gateway_order_id character varying(100),
    gateway_payment_id character varying(100),
    gateway_signature character varying(255),
    payment_status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    idempotency_key character varying(100),
    paid_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    monthly_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    yearly_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    trial_duration_days integer DEFAULT 14,
    currency character varying(3) DEFAULT 'INR'::character varying,
    max_branches integer DEFAULT 1 NOT NULL,
    max_doctors integer DEFAULT 1 NOT NULL,
    max_staff integer DEFAULT 2 NOT NULL,
    max_monthly_appointments integer DEFAULT 100 NOT NULL,
    storage_limit_mb integer DEFAULT 1000 NOT NULL,
    feature_entitlements jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 1,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: teleconsultation_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teleconsultation_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    clinic_id uuid,
    doctor_id uuid,
    patient_id uuid,
    room_code character varying(100) NOT NULL,
    room_url text,
    doctor_token text,
    patient_token text,
    token_expires_at timestamp with time zone NOT NULL,
    status character varying(50) DEFAULT 'SCHEDULED'::character varying,
    patient_joined_at timestamp with time zone,
    doctor_joined_at timestamp with time zone,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    duration_seconds integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



--
-- Name: traffic_route_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.traffic_route_snapshots (
    id uuid NOT NULL,
    origin_hash character varying(64) NOT NULL,
    destination_hash character varying(64) NOT NULL,
    travel_mode character varying(30) DEFAULT 'DRIVING'::character varying,
    duration_seconds integer NOT NULL,
    traffic_duration_seconds integer NOT NULL,
    distance_meters integer NOT NULL,
    distance_text character varying(50),
    duration_text character varying(50),
    raw_response json,
    cached_until timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);



--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    phone_number character varying(20),
    email character varying(255),
    password_hash character varying(255),
    full_name character varying(128) NOT NULL,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);



--
-- Name: COLUMN users.phone_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.phone_number IS 'Normalized E.164 phone number e.g. +919876543210';


--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt/Argon2 password hash, null for OTP-only users';


--
-- Name: abdm_consents abdm_consents_consent_artefact_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_consents
    ADD CONSTRAINT abdm_consents_consent_artefact_id_key UNIQUE (consent_artefact_id);


--
-- Name: abdm_consents abdm_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_consents
    ADD CONSTRAINT abdm_consents_pkey PRIMARY KEY (id);


--
-- Name: abdm_integrations abdm_integrations_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_integrations
    ADD CONSTRAINT abdm_integrations_clinic_id_key UNIQUE (clinic_id);


--
-- Name: abdm_integrations abdm_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_integrations
    ADD CONSTRAINT abdm_integrations_pkey PRIMARY KEY (id);


--
-- Name: ai_consultation_drafts ai_consultation_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_consultation_drafts
    ADD CONSTRAINT ai_consultation_drafts_pkey PRIMARY KEY (id);


--
-- Name: ai_lab_report_extractions ai_lab_report_extractions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_lab_report_extractions
    ADD CONSTRAINT ai_lab_report_extractions_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_job_logs automation_job_logs_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: automation_job_logs automation_job_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_settings automation_settings_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_settings
    ADD CONSTRAINT automation_settings_clinic_id_key UNIQUE (clinic_id);


--
-- Name: automation_settings automation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_settings
    ADD CONSTRAINT automation_settings_pkey PRIMARY KEY (id);


--
-- Name: billing_profiles billing_profiles_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_profiles
    ADD CONSTRAINT billing_profiles_clinic_id_key UNIQUE (clinic_id);


--
-- Name: billing_profiles billing_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_profiles
    ADD CONSTRAINT billing_profiles_pkey PRIMARY KEY (id);


--
-- Name: clinic_branch_schedules clinic_branch_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_branch_schedules
    ADD CONSTRAINT clinic_branch_schedules_pkey PRIMARY KEY (id);


--
-- Name: clinic_branches clinic_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_branches
    ADD CONSTRAINT clinic_branches_pkey PRIMARY KEY (id);


--
-- Name: clinic_correction_requests clinic_correction_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_correction_requests
    ADD CONSTRAINT clinic_correction_requests_pkey PRIMARY KEY (id);


--
-- Name: clinic_documents clinic_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_documents
    ADD CONSTRAINT clinic_documents_pkey PRIMARY KEY (id);


--
-- Name: clinic_memberships clinic_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_memberships
    ADD CONSTRAINT clinic_memberships_pkey PRIMARY KEY (id);


--
-- Name: clinic_subscriptions clinic_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_subscriptions
    ADD CONSTRAINT clinic_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: clinic_verification_history clinic_verification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_verification_history
    ADD CONSTRAINT clinic_verification_history_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: consultation_notes consultation_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_pkey PRIMARY KEY (id);


--
-- Name: delay_event_logs delay_event_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_pkey PRIMARY KEY (id);


--
-- Name: departure_recommendations departure_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_order_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_order_reference_key UNIQUE (order_reference);


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_laboratories diagnostic_laboratories_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_laboratories
    ADD CONSTRAINT diagnostic_laboratories_code_key UNIQUE (code);


--
-- Name: diagnostic_laboratories diagnostic_laboratories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_laboratories
    ADD CONSTRAINT diagnostic_laboratories_pkey PRIMARY KEY (id);


--
-- Name: doctor_credentials doctor_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_credentials
    ADD CONSTRAINT doctor_credentials_pkey PRIMARY KEY (id);


--
-- Name: doctor_profiles doctor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_profiles
    ADD CONSTRAINT doctor_profiles_pkey PRIMARY KEY (id);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);


--
-- Name: doctor_verification_history doctor_verification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_history
    ADD CONSTRAINT doctor_verification_history_pkey PRIMARY KEY (id);


--
-- Name: follow_up_records follow_up_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_pkey PRIMARY KEY (id);


--
-- Name: healthcare_provider_profiles healthcare_provider_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_provider_profiles
    ADD CONSTRAINT healthcare_provider_profiles_pkey PRIMARY KEY (id);


--
-- Name: healthcare_service_categories healthcare_service_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_service_categories
    ADD CONSTRAINT healthcare_service_categories_code_key UNIQUE (code);


--
-- Name: healthcare_service_categories healthcare_service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_service_categories
    ADD CONSTRAINT healthcare_service_categories_pkey PRIMARY KEY (id);


--
-- Name: healthcare_services healthcare_services_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_services
    ADD CONSTRAINT healthcare_services_code_key UNIQUE (code);


--
-- Name: healthcare_services healthcare_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_services
    ADD CONSTRAINT healthcare_services_pkey PRIMARY KEY (id);


--
-- Name: home_visit_bookings home_visit_bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_booking_reference_key UNIQUE (booking_reference);


--
-- Name: home_visit_bookings home_visit_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_pkey PRIMARY KEY (id);


--
-- Name: home_visit_service_records home_visit_service_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_service_records
    ADD CONSTRAINT home_visit_service_records_pkey PRIMARY KEY (id);


--
-- Name: home_visit_status_history home_visit_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_status_history
    ADD CONSTRAINT home_visit_status_history_pkey PRIMARY KEY (id);


--
-- Name: medical_documents medical_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_documents
    ADD CONSTRAINT medical_documents_pkey PRIMARY KEY (id);


--
-- Name: medical_record_shares medical_record_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_record_shares
    ADD CONSTRAINT medical_record_shares_pkey PRIMARY KEY (id);


--
-- Name: medical_record_shares medical_record_shares_share_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_record_shares
    ADD CONSTRAINT medical_record_shares_share_token_key UNIQUE (share_token);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: patient_medical_profiles patient_medical_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medical_profiles
    ADD CONSTRAINT patient_medical_profiles_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_adjustments payment_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_pkey PRIMARY KEY (id);


--
-- Name: payment_records payment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_pkey PRIMARY KEY (id);


--
-- Name: payment_webhook_events payment_webhook_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_event_id_key UNIQUE (event_id);


--
-- Name: payment_webhook_events payment_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pharmacy_orders pharmacy_orders_order_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_order_reference_key UNIQUE (order_reference);


--
-- Name: pharmacy_orders pharmacy_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_pkey PRIMARY KEY (id);


--
-- Name: pharmacy_partners pharmacy_partners_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_partners
    ADD CONSTRAINT pharmacy_partners_code_key UNIQUE (code);


--
-- Name: pharmacy_partners pharmacy_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_partners
    ADD CONSTRAINT pharmacy_partners_pkey PRIMARY KEY (id);


--
-- Name: platform_integrations platform_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_integrations
    ADD CONSTRAINT platform_integrations_pkey PRIMARY KEY (id);


--
-- Name: platform_integrations platform_integrations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_integrations
    ADD CONSTRAINT platform_integrations_slug_key UNIQUE (slug);


--
-- Name: prescription_medications prescription_medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_medications
    ADD CONSTRAINT prescription_medications_pkey PRIMARY KEY (id);


--
-- Name: prescription_versions prescription_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_versions
    ADD CONSTRAINT prescription_versions_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: provider_availability provider_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_pkey PRIMARY KEY (id);


--
-- Name: provider_availability provider_availability_provider_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_provider_id_day_of_week_key UNIQUE (provider_id, day_of_week);


--
-- Name: provider_complaints provider_complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_complaints
    ADD CONSTRAINT provider_complaints_pkey PRIMARY KEY (id);


--
-- Name: provider_credentials provider_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_credentials
    ADD CONSTRAINT provider_credentials_pkey PRIMARY KEY (id);


--
-- Name: provider_reviews provider_reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_reviews
    ADD CONSTRAINT provider_reviews_booking_id_key UNIQUE (booking_id);


--
-- Name: provider_reviews provider_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_reviews
    ADD CONSTRAINT provider_reviews_pkey PRIMARY KEY (id);


--
-- Name: provider_service_areas provider_service_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_service_areas
    ADD CONSTRAINT provider_service_areas_pkey PRIMARY KEY (id);


--
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- Name: provider_services provider_services_provider_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_service_id_key UNIQUE (provider_id, service_id);


--
-- Name: queue_entries queue_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_pkey PRIMARY KEY (id);


--
-- Name: queue_pause_history queue_pause_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_pause_history
    ADD CONSTRAINT queue_pause_history_pkey PRIMARY KEY (id);


--
-- Name: queue_policies queue_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_policies
    ADD CONSTRAINT queue_policies_pkey PRIMARY KEY (id);


--
-- Name: queue_sessions queue_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_pkey PRIMARY KEY (id);


--
-- Name: queue_state_history queue_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_state_history
    ADD CONSTRAINT queue_state_history_pkey PRIMARY KEY (id);


--
-- Name: queue_token_counters queue_token_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_token_counters
    ADD CONSTRAINT queue_token_counters_pkey PRIMARY KEY (id);


--
-- Name: record_access_logs record_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_access_logs
    ADD CONSTRAINT record_access_logs_pkey PRIMARY KEY (id);


--
-- Name: record_sharing_consents record_sharing_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_sharing_consents
    ADD CONSTRAINT record_sharing_consents_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: subscription_audit_logs subscription_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_audit_logs
    ADD CONSTRAINT subscription_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: subscription_invoices subscription_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: subscription_invoices subscription_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_gateway_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_gateway_payment_id_key UNIQUE (gateway_payment_id);


--
-- Name: subscription_payments subscription_payments_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_code_key UNIQUE (code);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: teleconsultation_rooms teleconsultation_rooms_appointment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_appointment_id_key UNIQUE (appointment_id);


--
-- Name: teleconsultation_rooms teleconsultation_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_pkey PRIMARY KEY (id);


--
-- Name: teleconsultation_rooms teleconsultation_rooms_room_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_room_code_key UNIQUE (room_code);


--
-- Name: traffic_route_snapshots traffic_route_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traffic_route_snapshots
    ADD CONSTRAINT traffic_route_snapshots_pkey PRIMARY KEY (id);


--
-- Name: clinic_branch_schedules uq_branch_day_schedule; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_branch_schedules
    ADD CONSTRAINT uq_branch_day_schedule UNIQUE (branch_id, day_of_week);


--
-- Name: patients uq_clinic_patient_phone; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT uq_clinic_patient_phone UNIQUE (clinic_id, phone_number);


--
-- Name: clinic_memberships uq_clinic_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_memberships
    ADD CONSTRAINT uq_clinic_user_role UNIQUE (clinic_id, user_id, role_id);


--
-- Name: patient_medical_profiles uq_patient_medical_profile; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medical_profiles
    ADD CONSTRAINT uq_patient_medical_profile UNIQUE (patient_id);


--
-- Name: prescription_versions uq_prescription_version; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_versions
    ADD CONSTRAINT uq_prescription_version UNIQUE (prescription_id, version_number);


--
-- Name: queue_policies uq_queue_policy_scope; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_policies
    ADD CONSTRAINT uq_queue_policy_scope UNIQUE (clinic_id, branch_id, doctor_id);


--
-- Name: queue_sessions uq_queue_session_daily; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT uq_queue_session_daily UNIQUE (clinic_id, branch_id, doctor_id, session_date);


--
-- Name: queue_token_counters uq_queue_token_counter_daily; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_token_counters
    ADD CONSTRAINT uq_queue_token_counter_daily UNIQUE (clinic_id, branch_id, doctor_id, counter_date);


--
-- Name: role_permissions uq_role_permission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_abdm_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abdm_clinic ON public.abdm_integrations USING btree (clinic_id);


--
-- Name: idx_abdm_cons_artefact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abdm_cons_artefact ON public.abdm_consents USING btree (consent_artefact_id);


--
-- Name: idx_abdm_cons_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abdm_cons_patient ON public.abdm_consents USING btree (patient_id);


--
-- Name: idx_abdm_cons_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abdm_cons_status ON public.abdm_consents USING btree (status);


--
-- Name: idx_abdm_hip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abdm_hip ON public.abdm_integrations USING btree (hip_id);


--
-- Name: idx_access_share; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_share ON public.record_access_logs USING btree (share_id);


--
-- Name: idx_access_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_time ON public.record_access_logs USING btree (accessed_at);


--
-- Name: idx_ai_draft_appt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_draft_appt ON public.ai_consultation_drafts USING btree (appointment_id);


--
-- Name: idx_ai_draft_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_draft_doc ON public.ai_consultation_drafts USING btree (doctor_id);


--
-- Name: idx_ai_draft_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_draft_status ON public.ai_consultation_drafts USING btree (status);


--
-- Name: idx_billing_profiles_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billing_profiles_clinic ON public.billing_profiles USING btree (clinic_id);


--
-- Name: idx_clinic_subs_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinic_subs_clinic ON public.clinic_subscriptions USING btree (clinic_id);


--
-- Name: idx_clinic_subs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinic_subs_status ON public.clinic_subscriptions USING btree (status);


--
-- Name: idx_dep_rec_appt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dep_rec_appt ON public.departure_recommendations USING btree (appointment_id);


--
-- Name: idx_dep_rec_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dep_rec_clinic ON public.departure_recommendations USING btree (clinic_id);


--
-- Name: idx_dep_rec_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dep_rec_patient ON public.departure_recommendations USING btree (patient_id);


--
-- Name: idx_dep_rec_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dep_rec_queue ON public.departure_recommendations USING btree (queue_entry_id);


--
-- Name: idx_diag_lab_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diag_lab_code ON public.diagnostic_laboratories USING btree (code);


--
-- Name: idx_hpp_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpp_clinic ON public.healthcare_provider_profiles USING btree (associated_clinic_id);


--
-- Name: idx_hpp_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpp_status ON public.healthcare_provider_profiles USING btree (verification_status);


--
-- Name: idx_hpp_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpp_type ON public.healthcare_provider_profiles USING btree (provider_type);


--
-- Name: idx_hpp_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpp_user ON public.healthcare_provider_profiles USING btree (user_id);


--
-- Name: idx_hs_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hs_category ON public.healthcare_services USING btree (category_id);


--
-- Name: idx_hs_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hs_code ON public.healthcare_services USING btree (code);


--
-- Name: idx_hsc_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hsc_active ON public.healthcare_service_categories USING btree (is_active);


--
-- Name: idx_hsc_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hsc_code ON public.healthcare_service_categories USING btree (code);


--
-- Name: idx_hvb_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvb_date ON public.home_visit_bookings USING btree (scheduled_date);


--
-- Name: idx_hvb_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvb_patient ON public.home_visit_bookings USING btree (patient_id);


--
-- Name: idx_hvb_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvb_provider ON public.home_visit_bookings USING btree (provider_id);


--
-- Name: idx_hvb_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvb_ref ON public.home_visit_bookings USING btree (booking_reference);


--
-- Name: idx_hvb_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvb_status ON public.home_visit_bookings USING btree (status);


--
-- Name: idx_hvsh_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvsh_booking ON public.home_visit_status_history USING btree (booking_id);


--
-- Name: idx_hvsr_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hvsr_booking ON public.home_visit_service_records USING btree (booking_id);


--
-- Name: idx_job_logs_idemp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_logs_idemp ON public.automation_job_logs USING btree (idempotency_key);


--
-- Name: idx_lab_ext_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_ext_clinic ON public.ai_lab_report_extractions USING btree (clinic_id);


--
-- Name: idx_lab_ext_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_ext_patient ON public.ai_lab_report_extractions USING btree (patient_id);


--
-- Name: idx_lab_ext_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_ext_status ON public.ai_lab_report_extractions USING btree (status);


--
-- Name: idx_lab_order_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_order_clinic ON public.diagnostic_lab_orders USING btree (clinic_id);


--
-- Name: idx_lab_order_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_order_patient ON public.diagnostic_lab_orders USING btree (patient_id);


--
-- Name: idx_lab_order_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_order_ref ON public.diagnostic_lab_orders USING btree (order_reference);


--
-- Name: idx_lab_order_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_order_status ON public.diagnostic_lab_orders USING btree (status);


--
-- Name: idx_p11_access_share_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_access_share_time ON public.record_access_logs USING btree (share_id, accessed_at DESC);


--
-- Name: idx_p11_appts_clinic_date_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_appts_clinic_date_status ON public.appointments USING btree (clinic_id, appointment_date, status);


--
-- Name: idx_p11_appts_doctor_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_appts_doctor_date ON public.appointments USING btree (doctor_id, appointment_date);


--
-- Name: idx_p11_appts_patient_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_appts_patient_created ON public.appointments USING btree (patient_id, created_at DESC);


--
-- Name: idx_p11_audit_actor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_audit_actor ON public.audit_logs USING btree (actor_user_id, created_at DESC);


--
-- Name: idx_p11_audit_clinic_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_audit_clinic_time ON public.audit_logs USING btree (clinic_id, created_at DESC);


--
-- Name: idx_p11_consult_appt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_consult_appt ON public.consultation_notes USING btree (appointment_id);


--
-- Name: idx_p11_consult_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_consult_doctor ON public.consultation_notes USING btree (doctor_id, created_at DESC);


--
-- Name: idx_p11_home_booking_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_home_booking_clinic ON public.home_visit_bookings USING btree (clinic_id, status);


--
-- Name: idx_p11_home_booking_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_home_booking_patient ON public.home_visit_bookings USING btree (patient_id, created_at DESC);


--
-- Name: idx_p11_home_booking_prov_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_home_booking_prov_status ON public.home_visit_bookings USING btree (provider_id, status);


--
-- Name: idx_p11_lab_orders_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_lab_orders_clinic ON public.diagnostic_lab_orders USING btree (clinic_id, created_at DESC);


--
-- Name: idx_p11_lab_orders_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_lab_orders_patient ON public.diagnostic_lab_orders USING btree (patient_id, status);


--
-- Name: idx_p11_pay_appt_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_pay_appt_status ON public.payment_records USING btree (appointment_id, payment_status);


--
-- Name: idx_p11_pay_clinic_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_pay_clinic_date ON public.payment_records USING btree (clinic_id, created_at DESC);


--
-- Name: idx_p11_pharm_orders_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_pharm_orders_patient ON public.pharmacy_orders USING btree (patient_id, status);


--
-- Name: idx_p11_pharm_orders_rx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_pharm_orders_rx ON public.pharmacy_orders USING btree (prescription_id);


--
-- Name: idx_p11_queue_patient_joined; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_queue_patient_joined ON public.queue_entries USING btree (patient_id, joined_at);


--
-- Name: idx_p11_queue_session_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_queue_session_status ON public.queue_entries USING btree (queue_session_id, queue_status);


--
-- Name: idx_p11_queue_token_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_queue_token_lookup ON public.queue_entries USING btree (clinic_id, token_number);


--
-- Name: idx_p11_rx_appt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_rx_appt ON public.prescriptions USING btree (appointment_id);


--
-- Name: idx_p11_rx_patient_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_rx_patient_clinic ON public.prescriptions USING btree (patient_id, clinic_id);


--
-- Name: idx_p11_rx_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_rx_status ON public.prescriptions USING btree (status);


--
-- Name: idx_p11_session_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_session_active ON public.queue_sessions USING btree (doctor_id, session_date, is_active);


--
-- Name: idx_p11_share_patient_exp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_share_patient_exp ON public.medical_record_shares USING btree (patient_id, expires_at);


--
-- Name: idx_p11_share_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_share_token ON public.medical_record_shares USING btree (share_token);


--
-- Name: idx_p11_sub_clinic_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_sub_clinic_status ON public.clinic_subscriptions USING btree (clinic_id, status);


--
-- Name: idx_p11_sub_inv_sub; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_sub_inv_sub ON public.subscription_invoices USING btree (subscription_id, created_at DESC);


--
-- Name: idx_p11_sub_pay_sub; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_sub_pay_sub ON public.subscription_payments USING btree (subscription_id, payment_status);


--
-- Name: idx_p11_tele_appt_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_tele_appt_status ON public.teleconsultation_rooms USING btree (appointment_id, status);


--
-- Name: idx_p11_tele_room_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_p11_tele_room_code ON public.teleconsultation_rooms USING btree (room_code);


--
-- Name: idx_pa_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_provider ON public.provider_availability USING btree (provider_id);


--
-- Name: idx_pc_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pc_provider ON public.provider_credentials USING btree (provider_id);


--
-- Name: idx_pc_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pc_status ON public.provider_complaints USING btree (status);


--
-- Name: idx_pharm_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharm_code ON public.pharmacy_partners USING btree (code);


--
-- Name: idx_pharm_order_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharm_order_patient ON public.pharmacy_orders USING btree (patient_id);


--
-- Name: idx_pharm_order_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharm_order_ref ON public.pharmacy_orders USING btree (order_reference);


--
-- Name: idx_pharm_order_rx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharm_order_rx ON public.pharmacy_orders USING btree (prescription_id);


--
-- Name: idx_pharm_order_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharm_order_status ON public.pharmacy_orders USING btree (status);


--
-- Name: idx_plat_cat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plat_cat ON public.platform_integrations USING btree (category);


--
-- Name: idx_plat_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plat_slug ON public.platform_integrations USING btree (slug);


--
-- Name: idx_pr_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_provider ON public.provider_reviews USING btree (provider_id);


--
-- Name: idx_ps_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ps_provider ON public.provider_services USING btree (provider_id);


--
-- Name: idx_ps_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ps_service ON public.provider_services USING btree (service_id);


--
-- Name: idx_psa_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psa_city ON public.provider_service_areas USING btree (city);


--
-- Name: idx_psa_postal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psa_postal ON public.provider_service_areas USING btree (postal_code);


--
-- Name: idx_psa_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psa_provider ON public.provider_service_areas USING btree (provider_id);


--
-- Name: idx_route_snapshots_hashes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_route_snapshots_hashes ON public.traffic_route_snapshots USING btree (origin_hash, destination_hash, travel_mode);


--
-- Name: idx_share_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_share_patient ON public.medical_record_shares USING btree (patient_id);


--
-- Name: idx_share_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_share_status ON public.medical_record_shares USING btree (status);


--
-- Name: idx_share_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_share_token ON public.medical_record_shares USING btree (share_token);


--
-- Name: idx_sub_audit_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_audit_clinic ON public.subscription_audit_logs USING btree (clinic_id);


--
-- Name: idx_sub_invoices_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_invoices_clinic ON public.subscription_invoices USING btree (clinic_id);


--
-- Name: idx_sub_invoices_num; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_invoices_num ON public.subscription_invoices USING btree (invoice_number);


--
-- Name: idx_sub_payments_clinic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_payments_clinic ON public.subscription_payments USING btree (clinic_id);


--
-- Name: idx_sub_payments_gateway_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_payments_gateway_order ON public.subscription_payments USING btree (gateway_order_id);


--
-- Name: idx_sub_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_payments_status ON public.subscription_payments USING btree (payment_status);


--
-- Name: idx_sub_plans_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_plans_active ON public.subscription_plans USING btree (is_active);


--
-- Name: idx_sub_plans_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_plans_code ON public.subscription_plans USING btree (code);


--
-- Name: idx_tele_appt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tele_appt ON public.teleconsultation_rooms USING btree (appointment_id);


--
-- Name: idx_tele_room_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tele_room_code ON public.teleconsultation_rooms USING btree (room_code);


--
-- Name: idx_tele_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tele_status ON public.teleconsultation_rooms USING btree (status);


--
-- Name: idx_webhook_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_events_id ON public.payment_webhook_events USING btree (event_id);


--
-- Name: ix_appointments_appointment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_appointment_date ON public.appointments USING btree (appointment_date);


--
-- Name: ix_appointments_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_branch_id ON public.appointments USING btree (branch_id);


--
-- Name: ix_appointments_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_clinic_id ON public.appointments USING btree (clinic_id);


--
-- Name: ix_appointments_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_doctor_id ON public.appointments USING btree (doctor_id);


--
-- Name: ix_appointments_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_patient_id ON public.appointments USING btree (patient_id);


--
-- Name: ix_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_status ON public.appointments USING btree (status);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_actor_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);


--
-- Name: ix_audit_logs_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_clinic_id ON public.audit_logs USING btree (clinic_id);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: ix_clinic_branch_schedules_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_branch_schedules_branch_id ON public.clinic_branch_schedules USING btree (branch_id);


--
-- Name: ix_clinic_branches_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_branches_city ON public.clinic_branches USING btree (city);


--
-- Name: ix_clinic_branches_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_branches_clinic_id ON public.clinic_branches USING btree (clinic_id);


--
-- Name: ix_clinic_branches_postal_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_branches_postal_code ON public.clinic_branches USING btree (postal_code);


--
-- Name: ix_clinic_correction_requests_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_correction_requests_clinic_id ON public.clinic_correction_requests USING btree (clinic_id);


--
-- Name: ix_clinic_documents_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_documents_clinic_id ON public.clinic_documents USING btree (clinic_id);


--
-- Name: ix_clinic_memberships_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_memberships_clinic_id ON public.clinic_memberships USING btree (clinic_id);


--
-- Name: ix_clinic_memberships_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_memberships_role_id ON public.clinic_memberships USING btree (role_id);


--
-- Name: ix_clinic_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_memberships_user_id ON public.clinic_memberships USING btree (user_id);


--
-- Name: ix_clinic_verification_history_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_verification_history_clinic_id ON public.clinic_verification_history USING btree (clinic_id);


--
-- Name: ix_clinic_verification_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinic_verification_history_created_at ON public.clinic_verification_history USING btree (created_at);


--
-- Name: ix_clinics_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinics_city ON public.clinics USING btree (city);


--
-- Name: ix_clinics_postal_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinics_postal_code ON public.clinics USING btree (postal_code);


--
-- Name: ix_clinics_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_clinics_slug ON public.clinics USING btree (slug);


--
-- Name: ix_consultation_notes_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_consultation_notes_appointment_id ON public.consultation_notes USING btree (appointment_id);


--
-- Name: ix_consultation_notes_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_consultation_notes_doctor_id ON public.consultation_notes USING btree (doctor_id);


--
-- Name: ix_doctor_credentials_doctor_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_credentials_doctor_profile_id ON public.doctor_credentials USING btree (doctor_profile_id);


--
-- Name: ix_doctor_profiles_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_profiles_clinic_id ON public.doctor_profiles USING btree (clinic_id);


--
-- Name: ix_doctor_profiles_medical_registration_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_profiles_medical_registration_number ON public.doctor_profiles USING btree (medical_registration_number);


--
-- Name: ix_doctor_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_profiles_user_id ON public.doctor_profiles USING btree (user_id);


--
-- Name: ix_doctor_schedules_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_schedules_branch_id ON public.doctor_schedules USING btree (branch_id);


--
-- Name: ix_doctor_schedules_doctor_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_schedules_doctor_profile_id ON public.doctor_schedules USING btree (doctor_profile_id);


--
-- Name: ix_doctor_verification_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_verification_history_created_at ON public.doctor_verification_history USING btree (created_at);


--
-- Name: ix_doctor_verification_history_doctor_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_verification_history_doctor_profile_id ON public.doctor_verification_history USING btree (doctor_profile_id);


--
-- Name: ix_follow_up_records_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follow_up_records_clinic_id ON public.follow_up_records USING btree (clinic_id);


--
-- Name: ix_follow_up_records_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follow_up_records_doctor_id ON public.follow_up_records USING btree (doctor_id);


--
-- Name: ix_follow_up_records_follow_up_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follow_up_records_follow_up_date ON public.follow_up_records USING btree (follow_up_date);


--
-- Name: ix_follow_up_records_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_follow_up_records_patient_id ON public.follow_up_records USING btree (patient_id);


--
-- Name: ix_medical_documents_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_medical_documents_clinic_id ON public.medical_documents USING btree (clinic_id);


--
-- Name: ix_medical_documents_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_medical_documents_patient_id ON public.medical_documents USING btree (patient_id);


--
-- Name: ix_otp_verifications_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_otp_verifications_expires_at ON public.otp_verifications USING btree (expires_at);


--
-- Name: ix_otp_verifications_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_otp_verifications_phone_number ON public.otp_verifications USING btree (phone_number);


--
-- Name: ix_patient_medical_profiles_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_patient_medical_profiles_clinic_id ON public.patient_medical_profiles USING btree (clinic_id);


--
-- Name: ix_patient_medical_profiles_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_patient_medical_profiles_patient_id ON public.patient_medical_profiles USING btree (patient_id);


--
-- Name: ix_patients_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_patients_clinic_id ON public.patients USING btree (clinic_id);


--
-- Name: ix_patients_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_patients_phone_number ON public.patients USING btree (phone_number);


--
-- Name: ix_patients_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_patients_user_id ON public.patients USING btree (user_id);


--
-- Name: ix_payment_adjustments_payment_record_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_adjustments_payment_record_id ON public.payment_adjustments USING btree (payment_record_id);


--
-- Name: ix_payment_records_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_records_appointment_id ON public.payment_records USING btree (appointment_id);


--
-- Name: ix_payment_records_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_records_clinic_id ON public.payment_records USING btree (clinic_id);


--
-- Name: ix_payment_records_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_records_patient_id ON public.payment_records USING btree (patient_id);


--
-- Name: ix_payment_records_receipt_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_payment_records_receipt_number ON public.payment_records USING btree (receipt_number);


--
-- Name: ix_permissions_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_permissions_code ON public.permissions USING btree (code);


--
-- Name: ix_prescription_medications_prescription_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescription_medications_prescription_version_id ON public.prescription_medications USING btree (prescription_version_id);


--
-- Name: ix_prescription_versions_prescription_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescription_versions_prescription_id ON public.prescription_versions USING btree (prescription_id);


--
-- Name: ix_prescription_versions_verification_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_prescription_versions_verification_token ON public.prescription_versions USING btree (verification_token);


--
-- Name: ix_prescriptions_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_appointment_id ON public.prescriptions USING btree (appointment_id);


--
-- Name: ix_prescriptions_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_branch_id ON public.prescriptions USING btree (branch_id);


--
-- Name: ix_prescriptions_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_clinic_id ON public.prescriptions USING btree (clinic_id);


--
-- Name: ix_prescriptions_consultation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_consultation_id ON public.prescriptions USING btree (consultation_id);


--
-- Name: ix_prescriptions_current_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_current_version_id ON public.prescriptions USING btree (current_version_id);


--
-- Name: ix_prescriptions_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_doctor_id ON public.prescriptions USING btree (doctor_id);


--
-- Name: ix_prescriptions_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_patient_id ON public.prescriptions USING btree (patient_id);


--
-- Name: ix_prescriptions_prescription_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_prescriptions_prescription_number ON public.prescriptions USING btree (prescription_number);


--
-- Name: ix_prescriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescriptions_status ON public.prescriptions USING btree (status);


--
-- Name: ix_queue_entries_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_queue_entries_appointment_id ON public.queue_entries USING btree (appointment_id);


--
-- Name: ix_queue_entries_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_branch_id ON public.queue_entries USING btree (branch_id);


--
-- Name: ix_queue_entries_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_clinic_id ON public.queue_entries USING btree (clinic_id);


--
-- Name: ix_queue_entries_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_doctor_id ON public.queue_entries USING btree (doctor_id);


--
-- Name: ix_queue_entries_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_patient_id ON public.queue_entries USING btree (patient_id);


--
-- Name: ix_queue_entries_queue_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_queue_session_id ON public.queue_entries USING btree (queue_session_id);


--
-- Name: ix_queue_entries_queue_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_queue_status ON public.queue_entries USING btree (queue_status);


--
-- Name: ix_queue_entries_token_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_token_number ON public.queue_entries USING btree (token_number);


--
-- Name: ix_queue_entries_token_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_entries_token_sequence ON public.queue_entries USING btree (token_sequence);


--
-- Name: ix_queue_pause_history_queue_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_pause_history_queue_session_id ON public.queue_pause_history USING btree (queue_session_id);


--
-- Name: ix_queue_policies_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_policies_clinic_id ON public.queue_policies USING btree (clinic_id);


--
-- Name: ix_queue_sessions_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_branch_id ON public.queue_sessions USING btree (branch_id);


--
-- Name: ix_queue_sessions_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_clinic_id ON public.queue_sessions USING btree (clinic_id);


--
-- Name: ix_queue_sessions_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_doctor_id ON public.queue_sessions USING btree (doctor_id);


--
-- Name: ix_queue_sessions_session_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_session_date ON public.queue_sessions USING btree (session_date);


--
-- Name: ix_queue_state_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_state_history_created_at ON public.queue_state_history USING btree (created_at);


--
-- Name: ix_queue_state_history_queue_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_state_history_queue_entry_id ON public.queue_state_history USING btree (queue_entry_id);


--
-- Name: ix_queue_token_counters_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_token_counters_branch_id ON public.queue_token_counters USING btree (branch_id);


--
-- Name: ix_queue_token_counters_clinic_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_token_counters_clinic_id ON public.queue_token_counters USING btree (clinic_id);


--
-- Name: ix_queue_token_counters_counter_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_token_counters_counter_date ON public.queue_token_counters USING btree (counter_date);


--
-- Name: ix_queue_token_counters_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_token_counters_doctor_id ON public.queue_token_counters USING btree (doctor_id);


--
-- Name: ix_record_sharing_consents_consent_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_record_sharing_consents_consent_token ON public.record_sharing_consents USING btree (consent_token);


--
-- Name: ix_record_sharing_consents_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_record_sharing_consents_patient_id ON public.record_sharing_consents USING btree (patient_id);


--
-- Name: ix_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: ix_role_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_phone_number ON public.users USING btree (phone_number);


--
-- Name: abdm_consents abdm_consents_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_consents
    ADD CONSTRAINT abdm_consents_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: abdm_consents abdm_consents_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_consents
    ADD CONSTRAINT abdm_consents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: abdm_integrations abdm_integrations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abdm_integrations
    ADD CONSTRAINT abdm_integrations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: ai_consultation_drafts ai_consultation_drafts_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_consultation_drafts
    ADD CONSTRAINT ai_consultation_drafts_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: ai_consultation_drafts ai_consultation_drafts_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_consultation_drafts
    ADD CONSTRAINT ai_consultation_drafts_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: ai_consultation_drafts ai_consultation_drafts_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_consultation_drafts
    ADD CONSTRAINT ai_consultation_drafts_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: ai_consultation_drafts ai_consultation_drafts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_consultation_drafts
    ADD CONSTRAINT ai_consultation_drafts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: ai_lab_report_extractions ai_lab_report_extractions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_lab_report_extractions
    ADD CONSTRAINT ai_lab_report_extractions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: ai_lab_report_extractions ai_lab_report_extractions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_lab_report_extractions
    ADD CONSTRAINT ai_lab_report_extractions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: ai_lab_report_extractions ai_lab_report_extractions_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_lab_report_extractions
    ADD CONSTRAINT ai_lab_report_extractions_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: automation_job_logs automation_job_logs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: automation_job_logs automation_job_logs_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: automation_job_logs automation_job_logs_queue_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_queue_entry_id_fkey FOREIGN KEY (queue_entry_id) REFERENCES public.queue_entries(id) ON DELETE SET NULL;


--
-- Name: automation_job_logs automation_job_logs_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_job_logs
    ADD CONSTRAINT automation_job_logs_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: automation_settings automation_settings_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_settings
    ADD CONSTRAINT automation_settings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: billing_profiles billing_profiles_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_profiles
    ADD CONSTRAINT billing_profiles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_branch_schedules clinic_branch_schedules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_branch_schedules
    ADD CONSTRAINT clinic_branch_schedules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: clinic_branches clinic_branches_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_branches
    ADD CONSTRAINT clinic_branches_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_correction_requests clinic_correction_requests_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_correction_requests
    ADD CONSTRAINT clinic_correction_requests_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clinic_correction_requests clinic_correction_requests_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_correction_requests
    ADD CONSTRAINT clinic_correction_requests_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_documents clinic_documents_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_documents
    ADD CONSTRAINT clinic_documents_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_documents clinic_documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_documents
    ADD CONSTRAINT clinic_documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clinic_memberships clinic_memberships_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_memberships
    ADD CONSTRAINT clinic_memberships_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_memberships clinic_memberships_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_memberships
    ADD CONSTRAINT clinic_memberships_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: clinic_memberships clinic_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_memberships
    ADD CONSTRAINT clinic_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clinic_subscriptions clinic_subscriptions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_subscriptions
    ADD CONSTRAINT clinic_subscriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_subscriptions clinic_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_subscriptions
    ADD CONSTRAINT clinic_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: clinic_verification_history clinic_verification_history_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_verification_history
    ADD CONSTRAINT clinic_verification_history_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clinic_verification_history clinic_verification_history_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_verification_history
    ADD CONSTRAINT clinic_verification_history_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: consultation_notes consultation_notes_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: consultation_notes consultation_notes_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT;


--
-- Name: delay_event_logs delay_event_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE SET NULL;


--
-- Name: delay_event_logs delay_event_logs_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: delay_event_logs delay_event_logs_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: delay_event_logs delay_event_logs_queue_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_queue_session_id_fkey FOREIGN KEY (queue_session_id) REFERENCES public.queue_sessions(id) ON DELETE SET NULL;


--
-- Name: delay_event_logs delay_event_logs_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event_logs
    ADD CONSTRAINT delay_event_logs_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: departure_recommendations departure_recommendations_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: departure_recommendations departure_recommendations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE SET NULL;


--
-- Name: departure_recommendations departure_recommendations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: departure_recommendations departure_recommendations_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE SET NULL;


--
-- Name: departure_recommendations departure_recommendations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: departure_recommendations departure_recommendations_queue_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departure_recommendations
    ADD CONSTRAINT departure_recommendations_queue_entry_id_fkey FOREIGN KEY (queue_entry_id) REFERENCES public.queue_entries(id) ON DELETE SET NULL;


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_laboratory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_laboratory_id_fkey FOREIGN KEY (laboratory_id) REFERENCES public.diagnostic_laboratories(id) ON DELETE CASCADE;


--
-- Name: diagnostic_lab_orders diagnostic_lab_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_lab_orders
    ADD CONSTRAINT diagnostic_lab_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: doctor_credentials doctor_credentials_doctor_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_credentials
    ADD CONSTRAINT doctor_credentials_doctor_profile_id_fkey FOREIGN KEY (doctor_profile_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: doctor_profiles doctor_profiles_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_profiles
    ADD CONSTRAINT doctor_profiles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: doctor_profiles doctor_profiles_primary_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_profiles
    ADD CONSTRAINT doctor_profiles_primary_branch_id_fkey FOREIGN KEY (primary_branch_id) REFERENCES public.clinic_branches(id) ON DELETE SET NULL;


--
-- Name: doctor_profiles doctor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_profiles
    ADD CONSTRAINT doctor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_doctor_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_profile_id_fkey FOREIGN KEY (doctor_profile_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: doctor_verification_history doctor_verification_history_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_history
    ADD CONSTRAINT doctor_verification_history_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: doctor_verification_history doctor_verification_history_doctor_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_history
    ADD CONSTRAINT doctor_verification_history_doctor_profile_id_fkey FOREIGN KEY (doctor_profile_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: follow_up_records follow_up_records_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: follow_up_records follow_up_records_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: follow_up_records follow_up_records_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: follow_up_records follow_up_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: follow_up_records follow_up_records_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_up_records
    ADD CONSTRAINT follow_up_records_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE SET NULL;


--
-- Name: healthcare_provider_profiles healthcare_provider_profiles_associated_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_provider_profiles
    ADD CONSTRAINT healthcare_provider_profiles_associated_clinic_id_fkey FOREIGN KEY (associated_clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: healthcare_provider_profiles healthcare_provider_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_provider_profiles
    ADD CONSTRAINT healthcare_provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: healthcare_provider_profiles healthcare_provider_profiles_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_provider_profiles
    ADD CONSTRAINT healthcare_provider_profiles_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: healthcare_services healthcare_services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healthcare_services
    ADD CONSTRAINT healthcare_services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.healthcare_service_categories(id) ON DELETE CASCADE;


--
-- Name: home_visit_bookings home_visit_bookings_booked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_booked_by_user_id_fkey FOREIGN KEY (booked_by_user_id) REFERENCES public.users(id);


--
-- Name: home_visit_bookings home_visit_bookings_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: home_visit_bookings home_visit_bookings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: home_visit_bookings home_visit_bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id);


--
-- Name: home_visit_bookings home_visit_bookings_service_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_service_category_id_fkey FOREIGN KEY (service_category_id) REFERENCES public.healthcare_service_categories(id);


--
-- Name: home_visit_bookings home_visit_bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_bookings
    ADD CONSTRAINT home_visit_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.healthcare_services(id);


--
-- Name: home_visit_service_records home_visit_service_records_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_service_records
    ADD CONSTRAINT home_visit_service_records_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.home_visit_bookings(id) ON DELETE CASCADE;


--
-- Name: home_visit_service_records home_visit_service_records_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_service_records
    ADD CONSTRAINT home_visit_service_records_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id);


--
-- Name: home_visit_status_history home_visit_status_history_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_status_history
    ADD CONSTRAINT home_visit_status_history_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.home_visit_bookings(id) ON DELETE CASCADE;


--
-- Name: home_visit_status_history home_visit_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_visit_status_history
    ADD CONSTRAINT home_visit_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id);


--
-- Name: medical_documents medical_documents_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_documents
    ADD CONSTRAINT medical_documents_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE SET NULL;


--
-- Name: medical_documents medical_documents_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_documents
    ADD CONSTRAINT medical_documents_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: medical_documents medical_documents_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_documents
    ADD CONSTRAINT medical_documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: medical_documents medical_documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_documents
    ADD CONSTRAINT medical_documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: medical_record_shares medical_record_shares_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_record_shares
    ADD CONSTRAINT medical_record_shares_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: patient_medical_profiles patient_medical_profiles_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medical_profiles
    ADD CONSTRAINT patient_medical_profiles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: patient_medical_profiles patient_medical_profiles_last_reviewed_by_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medical_profiles
    ADD CONSTRAINT patient_medical_profiles_last_reviewed_by_doctor_id_fkey FOREIGN KEY (last_reviewed_by_doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE SET NULL;


--
-- Name: patient_medical_profiles patient_medical_profiles_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medical_profiles
    ADD CONSTRAINT patient_medical_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patients patients_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: patients patients_registered_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_adjustments payment_adjustments_authorized_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_authorized_by_user_id_fkey FOREIGN KEY (authorized_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_adjustments payment_adjustments_payment_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustments
    ADD CONSTRAINT payment_adjustments_payment_record_id_fkey FOREIGN KEY (payment_record_id) REFERENCES public.payment_records(id) ON DELETE CASCADE;


--
-- Name: payment_records payment_records_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: payment_records payment_records_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: payment_records payment_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: payment_records payment_records_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pharmacy_orders pharmacy_orders_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: pharmacy_orders pharmacy_orders_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: pharmacy_orders pharmacy_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: pharmacy_orders pharmacy_orders_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacy_partners(id) ON DELETE CASCADE;


--
-- Name: pharmacy_orders pharmacy_orders_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacy_orders
    ADD CONSTRAINT pharmacy_orders_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: prescription_medications prescription_medications_prescription_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_medications
    ADD CONSTRAINT prescription_medications_prescription_version_id_fkey FOREIGN KEY (prescription_version_id) REFERENCES public.prescription_versions(id) ON DELETE CASCADE;


--
-- Name: prescription_versions prescription_versions_finalized_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_versions
    ADD CONSTRAINT prescription_versions_finalized_by_user_id_fkey FOREIGN KEY (finalized_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: prescription_versions prescription_versions_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_versions
    ADD CONSTRAINT prescription_versions_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultation_notes(id) ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_voided_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_voided_by_user_id_fkey FOREIGN KEY (voided_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: provider_availability provider_availability_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id) ON DELETE CASCADE;


--
-- Name: provider_complaints provider_complaints_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_complaints
    ADD CONSTRAINT provider_complaints_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.home_visit_bookings(id);


--
-- Name: provider_complaints provider_complaints_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_complaints
    ADD CONSTRAINT provider_complaints_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id);


--
-- Name: provider_complaints provider_complaints_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_complaints
    ADD CONSTRAINT provider_complaints_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public.users(id);


--
-- Name: provider_credentials provider_credentials_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_credentials
    ADD CONSTRAINT provider_credentials_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id) ON DELETE CASCADE;


--
-- Name: provider_reviews provider_reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_reviews
    ADD CONSTRAINT provider_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.home_visit_bookings(id) ON DELETE CASCADE;


--
-- Name: provider_reviews provider_reviews_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_reviews
    ADD CONSTRAINT provider_reviews_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: provider_reviews provider_reviews_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_reviews
    ADD CONSTRAINT provider_reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id);


--
-- Name: provider_service_areas provider_service_areas_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_service_areas
    ADD CONSTRAINT provider_service_areas_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_provider_profiles(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.healthcare_services(id) ON DELETE CASCADE;


--
-- Name: queue_entries queue_entries_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: queue_entries queue_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: queue_entries queue_entries_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: queue_entries queue_entries_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: queue_entries queue_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT;


--
-- Name: queue_entries queue_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: queue_entries queue_entries_priority_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_priority_assigned_by_id_fkey FOREIGN KEY (priority_assigned_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: queue_entries queue_entries_queue_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_queue_session_id_fkey FOREIGN KEY (queue_session_id) REFERENCES public.queue_sessions(id) ON DELETE CASCADE;


--
-- Name: queue_pause_history queue_pause_history_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_pause_history
    ADD CONSTRAINT queue_pause_history_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: queue_pause_history queue_pause_history_queue_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_pause_history
    ADD CONSTRAINT queue_pause_history_queue_session_id_fkey FOREIGN KEY (queue_session_id) REFERENCES public.queue_sessions(id) ON DELETE CASCADE;


--
-- Name: queue_policies queue_policies_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_policies
    ADD CONSTRAINT queue_policies_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: queue_policies queue_policies_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_policies
    ADD CONSTRAINT queue_policies_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: queue_policies queue_policies_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_policies
    ADD CONSTRAINT queue_policies_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: queue_sessions queue_sessions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: queue_sessions queue_sessions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: queue_sessions queue_sessions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: queue_state_history queue_state_history_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_state_history
    ADD CONSTRAINT queue_state_history_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: queue_state_history queue_state_history_queue_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_state_history
    ADD CONSTRAINT queue_state_history_queue_entry_id_fkey FOREIGN KEY (queue_entry_id) REFERENCES public.queue_entries(id) ON DELETE CASCADE;


--
-- Name: queue_token_counters queue_token_counters_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_token_counters
    ADD CONSTRAINT queue_token_counters_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.clinic_branches(id) ON DELETE CASCADE;


--
-- Name: queue_token_counters queue_token_counters_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_token_counters
    ADD CONSTRAINT queue_token_counters_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: queue_token_counters queue_token_counters_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_token_counters
    ADD CONSTRAINT queue_token_counters_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: record_access_logs record_access_logs_share_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_access_logs
    ADD CONSTRAINT record_access_logs_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.medical_record_shares(id) ON DELETE CASCADE;


--
-- Name: record_sharing_consents record_sharing_consents_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_sharing_consents
    ADD CONSTRAINT record_sharing_consents_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: record_sharing_consents record_sharing_consents_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_sharing_consents
    ADD CONSTRAINT record_sharing_consents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: subscription_audit_logs subscription_audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_audit_logs
    ADD CONSTRAINT subscription_audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscription_audit_logs subscription_audit_logs_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_audit_logs
    ADD CONSTRAINT subscription_audit_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: subscription_audit_logs subscription_audit_logs_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_audit_logs
    ADD CONSTRAINT subscription_audit_logs_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.clinic_subscriptions(id) ON DELETE SET NULL;


--
-- Name: subscription_invoices subscription_invoices_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: subscription_invoices subscription_invoices_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.subscription_payments(id) ON DELETE SET NULL;


--
-- Name: subscription_invoices subscription_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.clinic_subscriptions(id) ON DELETE SET NULL;


--
-- Name: subscription_payments subscription_payments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.clinic_subscriptions(id) ON DELETE SET NULL;


--
-- Name: teleconsultation_rooms teleconsultation_rooms_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: teleconsultation_rooms teleconsultation_rooms_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: teleconsultation_rooms teleconsultation_rooms_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;


--
-- Name: teleconsultation_rooms teleconsultation_rooms_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teleconsultation_rooms
    ADD CONSTRAINT teleconsultation_rooms_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


