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
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinics VALUES ('7c699726-c10d-4616-9ad8-12ee52cac521', 'Apex Heart & Health Institute', 'apex-heart-koramangala', 'SPECIALTY', 'REG-KA-2024-9912', 'contact@apex.in', '+919876543220', '80ft Road, Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', NULL, NULL, 'VERIFIED', true, '2026-11-11 18:23:16.048463+05:30', '2026-11-13 07:10:36.138333+05:30', NULL, 2020, NULL, NULL);
INSERT INTO public.clinics VALUES ('99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Family Clinic', 'careplus-indiranagar', 'POLYCLINIC', 'REG-KA-2024-8841', 'contact@careplus.in', '+919876543210', '100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', NULL, NULL, 'VERIFIED', true, '2026-11-11 18:23:16.048463+05:30', '2026-11-13 07:21:51.442951+05:30', NULL, 2018, NULL, NULL);


--
-- Data for Name: clinic_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinic_branches VALUES ('382141c5-6ffa-4e40-a818-285848077ab3', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, 12.9698000, 77.7499000, 'OPERATIONAL', true, '2026-11-11 18:28:48.871472+05:30', '2026-11-11 18:28:48.886262+05:30');
INSERT INTO public.clinic_branches VALUES ('4e7fda3e-0dc0-4c01-b466-4d3129ab5370', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, 12.9698000, 77.7499000, 'OPERATIONAL', true, '2026-11-11 19:59:47.003301+05:30', '2026-11-11 19:59:47.011715+05:30');
INSERT INTO public.clinic_branches VALUES ('0c2d405e-79cc-4124-a94f-bd38b15f5647', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 01:13:11.546024+05:30', '2026-11-13 01:13:11.552369+05:30');
INSERT INTO public.clinic_branches VALUES ('894dc52a-1ae6-414a-8d9a-f8e3790edda9', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 01:46:07.007235+05:30', '2026-11-13 01:46:07.015846+05:30');
INSERT INTO public.clinic_branches VALUES ('aa31367f-5e8f-4066-8345-e02b059dd67c', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'Main Branch - Indiranagar', true, '+919876543210', 'main@careplus.in', '100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 12.9784000, 77.6408000, 'OPERATIONAL', true, '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_branches VALUES ('8d188398-bd88-4fee-a72b-9c0d8e6b2857', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'Koramangala Diagnostic Center', false, '+919876543214', 'koramangala@careplus.in', '80ft Road, 4th Block', 'Bengaluru', 'Karnataka', '560034', 12.9352000, 77.6245000, 'OPERATIONAL', true, '2026-11-13 03:39:47.228347+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.clinic_branches VALUES ('eb35513c-2196-4a38-90fa-d836a4e59c70', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'Whitefield Medical Hub', false, '+919876543215', 'whitefield@careplus.in', 'ITPL Main Road', 'Bengaluru', 'Karnataka', '560066', 12.9698000, 77.7499000, 'OPERATIONAL', true, '2026-11-13 03:39:47.228347+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.clinic_branches VALUES ('c5b9fd65-5e0d-4e1f-a731-607e7550955c', '7c699726-c10d-4616-9ad8-12ee52cac521', 'Apex Koramangala Flagship', true, '+919876543220', 'koramangala@apex.in', '80ft Road, Koramangala', 'Bengaluru', 'Karnataka', '560034', 12.9352000, 77.6245000, 'OPERATIONAL', true, '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_branches VALUES ('e2f4730f-8a99-4b6b-bc84-d4d083ab3457', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 04:13:05.591873+05:30', '2026-11-13 04:13:05.600964+05:30');
INSERT INTO public.clinic_branches VALUES ('48b6bcd0-ab02-4956-a57b-16f38bc64470', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 05:00:09.294223+05:30', '2026-11-13 05:00:09.302777+05:30');
INSERT INTO public.clinic_branches VALUES ('d8163a9c-2b41-4731-97d6-f810e388b395', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 06:03:55.351699+05:30', '2026-11-13 06:03:55.361881+05:30');
INSERT INTO public.clinic_branches VALUES ('43b2bbcf-d948-4b27-88dd-846928b65abc', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'CarePlus Whitefield Diagnostic Hub', false, '+919876543299', NULL, 'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka', NULL, NULL, NULL, 'OPERATIONAL', true, '2026-11-13 06:51:19.993066+05:30', '2026-11-13 06:51:20.003391+05:30');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES ('c01462f6-e391-4cfe-acf5-8cf7621880f6', 'SUPER_ADMIN', 'System role SUPER_ADMIN', true, '2026-11-09 07:59:38.412962+05:30', '2026-11-09 07:59:38.412962+05:30');
INSERT INTO public.roles VALUES ('3c6021bf-4891-4bdd-99f2-569151ccaa54', 'CLINIC_OWNER', 'System role CLINIC_OWNER', true, '2026-11-09 07:59:38.451724+05:30', '2026-11-09 07:59:38.451724+05:30');
INSERT INTO public.roles VALUES ('80437ddf-6701-45c9-b6e0-64395910d556', 'DOCTOR', 'System role DOCTOR', true, '2026-11-09 07:59:38.481388+05:30', '2026-11-09 07:59:38.481388+05:30');
INSERT INTO public.roles VALUES ('ad463f07-2995-4c6f-bbb5-9f14efb94ebd', 'RECEPTIONIST', 'System role RECEPTIONIST', true, '2026-11-09 07:59:38.509834+05:30', '2026-11-09 07:59:38.509834+05:30');
INSERT INTO public.roles VALUES ('8bd84f57-97e5-4663-b45f-75ecd8da1c7e', 'PATIENT', 'System role PATIENT', true, '2026-11-09 07:59:38.550898+05:30', '2026-11-09 07:59:38.550898+05:30');
INSERT INTO public.roles VALUES ('6901be6a-089a-4e85-ab4a-0e711d070bfe', 'HEALTHCARE_PROVIDER', 'System role HEALTHCARE_PROVIDER', true, '2026-11-09 07:59:38.565393+05:30', '2026-11-09 07:59:38.565393+05:30');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('44444444-4444-4444-4444-444444440003', '+919876543303', 'physio.arun@careplus.in', '$2a$10$KSz229s9Rz5whSRUXjfeK.Ol3mGOGAlmWATSoOcCMNSrnX3kFJyIO', 'Dr. Arun Kumar, BPT', true, true, NULL, '2026-11-13 04:34:35.506845+05:30', '2026-11-13 04:34:35.506845+05:30');
INSERT INTO public.users VALUES ('44444444-4444-4444-4444-444444440004', '+919876543304', 'lab.suresh@careplus.in', '$2a$10$KSz229s9Rz5whSRUXjfeK.Ol3mGOGAlmWATSoOcCMNSrnX3kFJyIO', 'Suresh Nair', true, true, NULL, '2026-11-13 04:34:35.506845+05:30', '2026-11-13 04:34:35.506845+05:30');
INSERT INTO public.users VALUES ('9ce69669-a0c7-4858-af2b-7cc465f82121', '+919999999998', 'admin@smartclinicos.in', '$2a$10$0XO2VdkuoEqQKybVKqTrVedMWRFZ3SjTC4SfdSlc.DgvtajFWl2zG', 'Platform Super Admin', true, true, '2026-11-15 05:04:05.278893+05:30', '2026-11-11 19:57:08.940336+05:30', '2026-11-11 19:57:08.940336+05:30');
INSERT INTO public.users VALUES ('0e563902-0325-4cd8-a755-0e74f111fa78', '+919876543210', 'owner@careplus.in', '$2a$10$NbbMACUzdW89nntN7hwas.M3mnwGx8gEU2lMnF08tZOeqtH2FuU7e', 'Dr. Ramesh Gupta', true, true, '2026-11-15 05:04:05.429194+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.users VALUES ('4c7536fe-dc8f-4501-bad8-db9a54abdcc7', '+919876599999', NULL, NULL, 'Aditi Sharma Patient', true, true, NULL, '2026-11-13 04:43:35.07001+05:30', '2026-11-13 04:43:35.07001+05:30');
INSERT INTO public.users VALUES ('44444444-4444-4444-4444-444444440002', '+919876543302', 'nurse.mary@careplus.in', '$2a$10$KSz229s9Rz5whSRUXjfeK.Ol3mGOGAlmWATSoOcCMNSrnX3kFJyIO', 'Sister Mary Varghese', true, true, '2026-11-13 07:21:52.860195+05:30', '2026-11-13 04:34:35.506845+05:30', '2026-11-13 04:34:35.506845+05:30');
INSERT INTO public.users VALUES ('e10d73e2-e4e9-4692-ba63-405d1226f9fd', '+919876543220', 'owner@apex.in', '$2a$10$NbbMACUzdW89nntN7hwas.M3mnwGx8gEU2lMnF08tZOeqtH2FuU7e', 'Dr. Vikram Malhotra', true, true, '2026-11-15 05:04:05.512981+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.users VALUES ('2a0e2dcf-a47a-47b7-87ae-a750c3b318b1', '+919876543211', 'doctor@careplus.in', '$2a$10$NbbMACUzdW89nntN7hwas.M3mnwGx8gEU2lMnF08tZOeqtH2FuU7e', 'Dr. Ananya Sharma', true, true, '2026-11-13 12:30:11.770178+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.users VALUES ('29b13f44-c811-4616-ad93-6a9d27655791', '+919876543221', 'doctor@apex.in', '$2a$10$NbbMACUzdW89nntN7hwas.M3mnwGx8gEU2lMnF08tZOeqtH2FuU7e', 'Dr. Sneha Verma', true, true, '2026-11-13 03:47:13.557045+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.users VALUES ('ea10f791-c197-4c7f-8e48-990d7546f20c', '+919876543212', 'reception@careplus.in', '$2a$10$NbbMACUzdW89nntN7hwas.M3mnwGx8gEU2lMnF08tZOeqtH2FuU7e', 'Priya Patel', true, true, '2026-11-13 12:34:59.387047+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');
INSERT INTO public.users VALUES ('44444444-4444-4444-4444-444444440001', '+919876543301', 'doctor.home@careplus.in', '$2a$10$KSz229s9Rz5whSRUXjfeK.Ol3mGOGAlmWATSoOcCMNSrnX3kFJyIO', 'Dr. Rajesh Sharma', true, true, '2026-11-13 06:50:44.922746+05:30', '2026-11-13 04:34:35.506845+05:30', '2026-11-13 04:34:35.506845+05:30');
INSERT INTO public.users VALUES ('b23d4748-4b24-421d-ab75-d169f897d8d8', '+919999999999', 'admin@smartclinic.in', '$2a$10$0XO2VdkuoEqQKybVKqTrVedMWRFZ3SjTC4SfdSlc.DgvtajFWl2zG', 'System Super Admin', true, true, '2026-11-13 07:21:57.23515+05:30', '2026-11-11 18:23:16.048463+05:30', '2026-11-13 03:39:47.228347+05:30');


--
-- Data for Name: clinic_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinic_memberships VALUES ('05c6f84a-26c3-4a0f-9205-a1c659018e17', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', '0e563902-0325-4cd8-a755-0e74f111fa78', '3c6021bf-4891-4bdd-99f2-569151ccaa54', 'ACTIVE', '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_memberships VALUES ('c5bdcfbb-8f9e-417a-99ca-edcd11ab33a4', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', '2a0e2dcf-a47a-47b7-87ae-a750c3b318b1', '80437ddf-6701-45c9-b6e0-64395910d556', 'ACTIVE', '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_memberships VALUES ('889a0091-47c8-49e7-af21-75a288a82d2b', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'ea10f791-c197-4c7f-8e48-990d7546f20c', 'ad463f07-2995-4c6f-bbb5-9f14efb94ebd', 'ACTIVE', '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_memberships VALUES ('c7eb929a-ec72-494e-a97e-d9a0b9249813', '7c699726-c10d-4616-9ad8-12ee52cac521', 'e10d73e2-e4e9-4692-ba63-405d1226f9fd', '3c6021bf-4891-4bdd-99f2-569151ccaa54', 'ACTIVE', '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_memberships VALUES ('e5d6d835-5fd2-47ca-8c38-2950196832d6', '7c699726-c10d-4616-9ad8-12ee52cac521', '29b13f44-c811-4616-ad93-6a9d27655791', '80437ddf-6701-45c9-b6e0-64395910d556', 'ACTIVE', '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.clinic_memberships VALUES ('d9da164e-0b0c-41e4-ad5d-c59ffd4c3035', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', '9ce69669-a0c7-4858-af2b-7cc465f82121', 'c01462f6-e391-4cfe-acf5-8cf7621880f6', 'ACTIVE', '2026-11-11 19:57:08.954185+05:30', '2026-11-11 19:57:08.954185+05:30');
INSERT INTO public.clinic_memberships VALUES ('4702375f-84e8-4c4b-8e07-7e1ae9ea32da', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'b23d4748-4b24-421d-ab75-d169f897d8d8', 'c01462f6-e391-4cfe-acf5-8cf7621880f6', 'ACTIVE', '2026-11-11 19:57:08.96896+05:30', '2026-11-11 19:57:08.96896+05:30');


--
-- Data for Name: doctor_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.doctor_profiles VALUES ('49e6a5e6-7245-4803-840b-107926536b19', '2a0e2dcf-a47a-47b7-87ae-a750c3b318b1', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', 'aa31367f-5e8f-4066-8345-e02b059dd67c', 'MBBS, MD (General Medicine)', 'General Physician', 'KMC-2012-45219', 'Karnataka Medical Council', 12, 500.00, 15, 'VERIFIED', NULL, true, '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');
INSERT INTO public.doctor_profiles VALUES ('c21c964b-5289-4827-bfa2-0f3e6e68ff86', '29b13f44-c811-4616-ad93-6a9d27655791', '7c699726-c10d-4616-9ad8-12ee52cac521', 'c5b9fd65-5e0d-4e1f-a731-607e7550955c', 'MBBS, MD, DM (Cardiology)', 'Cardiologist', 'KMC-2015-88310', 'Karnataka Medical Council', 12, 800.00, 15, 'VERIFIED', NULL, true, '2026-11-11 18:23:16.048463+05:30', '2026-11-11 18:23:16.048463+05:30');


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.patients VALUES ('79605f8c-9cc5-4c39-869f-c52b4eb7e7d0', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Aditi Sharma', '+919813398463', NULL, '1992-04-12', 'FEMALE', 'B+', NULL, 'Bengaluru', NULL, NULL, 'Penicillin', 'Asthma since childhood', 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 04:13:05.433426+05:30', '2026-11-13 04:13:05.433426+05:30');
INSERT INTO public.patients VALUES ('ee5550ef-572b-4221-9f90-2ff4f3216561', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Rajesh Kumar Walkin', '+919715379716', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 04:13:05.458312+05:30', '2026-11-13 04:13:05.458312+05:30');
INSERT INTO public.patients VALUES ('631c144a-45e3-46a6-bac5-51307aec9041', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', '4c7536fe-dc8f-4501-bad8-db9a54abdcc7', 'Aditi Sharma Patient', '+919876599999', NULL, NULL, 'OTHER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-11-13 04:49:45.5542+05:30', '2026-11-13 04:49:45.5542+05:30');
INSERT INTO public.patients VALUES ('5a30d662-3780-4199-87ae-cfb9bc9fd051', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Aditi Sharma', '+919822898949', NULL, '1992-04-12', 'FEMALE', 'B+', NULL, 'Bengaluru', NULL, NULL, 'Penicillin', 'Asthma since childhood', 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 05:00:09.076748+05:30', '2026-11-13 05:00:09.076748+05:30');
INSERT INTO public.patients VALUES ('ef9ae8e8-ded0-439c-bf5d-ac28a299dee4', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Rajesh Kumar Walkin', '+919798727199', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 05:00:09.118074+05:30', '2026-11-13 05:00:09.118074+05:30');
INSERT INTO public.patients VALUES ('1044c131-b973-40ea-8534-e4f3f0db1c00', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Aditi Sharma', '+919839252502', NULL, '1992-04-12', 'FEMALE', 'B+', NULL, 'Bengaluru', NULL, NULL, 'Penicillin', 'Asthma since childhood', 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 06:03:55.172421+05:30', '2026-11-13 06:03:55.172421+05:30');
INSERT INTO public.patients VALUES ('dc772dd1-e4fc-46d9-bbe3-91bf4c8f78db', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Rajesh Kumar Walkin', '+919752711580', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 06:03:55.208767+05:30', '2026-11-13 06:03:55.208767+05:30');
INSERT INTO public.patients VALUES ('bb6b5d5f-88d4-44dd-9f44-962b41434e12', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Aditi Sharma', '+919840838784', NULL, '1992-04-12', 'FEMALE', 'B+', NULL, 'Bengaluru', NULL, NULL, 'Penicillin', 'Asthma since childhood', 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 06:51:19.812508+05:30', '2026-11-13 06:51:19.812508+05:30');
INSERT INTO public.patients VALUES ('be950165-b2cc-4b26-8d01-84bed9f475fa', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Rajesh Kumar Walkin', '+919763609319', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 06:51:19.840526+05:30', '2026-11-13 06:51:19.840526+05:30');
INSERT INTO public.patients VALUES ('5685c788-5816-4e01-a854-e06768342e32', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 1', '+919988776610', NULL, NULL, 'FEMALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.093078+05:30', '2026-11-13 07:00:25.093078+05:30');
INSERT INTO public.patients VALUES ('e73aebed-b69d-4523-b50e-0c555b92cd0b', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 2', '+919988776611', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.148669+05:30', '2026-11-13 07:00:25.148669+05:30');
INSERT INTO public.patients VALUES ('a0197138-cc50-4639-9aed-65b3b3709270', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 3', '+919988776612', NULL, NULL, 'FEMALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.14924+05:30', '2026-11-13 07:00:25.14924+05:30');
INSERT INTO public.patients VALUES ('95f3e928-aed6-4e38-b1ea-cfeb4421b694', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 4', '+919988776613', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.154073+05:30', '2026-11-13 07:00:25.154073+05:30');
INSERT INTO public.patients VALUES ('84102300-6f31-4fcf-a125-126f5c74937e', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 5', '+919988776614', NULL, NULL, 'FEMALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.156168+05:30', '2026-11-13 07:00:25.156168+05:30');
INSERT INTO public.patients VALUES ('1e415af7-3a5a-4581-9e40-e0b563d6bb50', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 8', '+919988776617', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.166671+05:30', '2026-11-13 07:00:25.166671+05:30');
INSERT INTO public.patients VALUES ('4f97e354-a686-45c4-800e-e8b4c0f1741c', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 7', '+919988776616', NULL, NULL, 'FEMALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.168608+05:30', '2026-11-13 07:00:25.168608+05:30');
INSERT INTO public.patients VALUES ('babcd468-652c-4b0b-94d3-32fbcb448c2f', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Concurrent Patient 6', '+919988776615', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:00:25.170477+05:30', '2026-11-13 07:00:25.170477+05:30');
INSERT INTO public.patients VALUES ('d2017949-f219-4342-9b27-8ed07e49f5eb', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919799132600', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:06:00.829237+05:30', '2026-11-13 07:06:00.829237+05:30');
INSERT INTO public.patients VALUES ('d5d391d7-7a2c-4697-85f8-a566a422e31e', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919625530071', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:06:00.862129+05:30', '2026-11-13 07:06:00.862129+05:30');
INSERT INTO public.patients VALUES ('2fcc6a60-1c23-482f-9f18-0809ed6580ec', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919718595091', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:07:55.554377+05:30', '2026-11-13 07:07:55.554377+05:30');
INSERT INTO public.patients VALUES ('18e2d835-c359-47f1-87ef-c3fa7b1e0de5', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919684403935', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:07:55.593799+05:30', '2026-11-13 07:07:55.593799+05:30');
INSERT INTO public.patients VALUES ('2d2421bc-0420-40d0-ae4b-6361df80e593', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919798364886', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:14:00.90589+05:30', '2026-11-13 07:14:00.90589+05:30');
INSERT INTO public.patients VALUES ('8298f928-c5e6-4d84-8b87-bccd5ac40bb0', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919678947868', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:14:00.951155+05:30', '2026-11-13 07:14:00.951155+05:30');
INSERT INTO public.patients VALUES ('2d67a0a9-f800-454f-83f8-5e89201a938c', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919741457484', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:16:13.514722+05:30', '2026-11-13 07:16:13.514722+05:30');
INSERT INTO public.patients VALUES ('b432acf2-427c-4151-9032-5d3be03f4edb', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919627530720', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:16:13.562065+05:30', '2026-11-13 07:16:13.562065+05:30');
INSERT INTO public.patients VALUES ('025edb4a-cc87-40bb-82fe-ccefb11016b1', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919743705385', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:19:39.5821+05:30', '2026-11-13 07:19:39.5821+05:30');
INSERT INTO public.patients VALUES ('bcae6e2d-7dd7-48ce-b9d3-0974dd4683dd', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919687288157', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:19:39.607356+05:30', '2026-11-13 07:19:39.607356+05:30');
INSERT INTO public.patients VALUES ('e672efa2-8bf9-4ac8-89d8-79340d3c5e8a', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919749223682', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:24.41222+05:30', '2026-11-13 07:21:24.41222+05:30');
INSERT INTO public.patients VALUES ('39d0f8ac-0999-46d4-ba79-a312d1ded684', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919643466687', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:24.440879+05:30', '2026-11-13 07:21:24.440879+05:30');
INSERT INTO public.patients VALUES ('a1c2e709-eec5-4722-8423-f3d727a68f93', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919766713635', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:42.780482+05:30', '2026-11-13 07:21:42.780482+05:30');
INSERT INTO public.patients VALUES ('1249b7dd-b9c2-404d-a42a-ac9581595f4f', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919635242745', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:42.816347+05:30', '2026-11-13 07:21:42.816347+05:30');
INSERT INTO public.patients VALUES ('f5f15e9f-f464-4bdb-9e57-41c0df883493', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Pooja Hegde', '+919767111635', NULL, '1992-06-15', 'FEMALE', NULL, NULL, 'Bengaluru', NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:51.68087+05:30', '2026-11-13 07:21:51.68087+05:30');
INSERT INTO public.patients VALUES ('026d1e4d-c3f1-4234-9076-87c5a7a44035', '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc', NULL, 'Walkin Test Patient', '+919632576907', NULL, NULL, 'MALE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ea10f791-c197-4c7f-8e48-990d7546f20c', true, '2026-11-13 07:21:51.71262+05:30', '2026-11-13 07:21:51.71262+05:30');


--
-- PostgreSQL database dump complete
--


