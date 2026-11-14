# Phase 7 — Notification Workflows
## Multi-Channel Patient Engagement Specifications

### 1. Notification Channels
Smart Clinic OS supports three delivery channels for Indian outpatient clinics:
1. **WhatsApp Business API**: Primary channel with high open rates (~98%).
2. **SMS Gateway**: Fallback channel complying with Indian TRAI DLT regulations.
3. **In-App & Socket.IO**: Real-time push and live dashboard state updates.

### 2. Message Templates

#### Template 1: 24-Hour Appointment Reminder
- **Subject**: Appointment Reminder: Dr. {doctor_name} Tomorrow
- **Body**: "Namaste {patient_name}, your appointment with {doctor_name} at {clinic_name} ({branch_name}) is scheduled for tomorrow at {appointment_time}. Please reach 10 minutes prior. To view traffic-aware departure recommendation, open Smart Clinic OS: {link}"

#### Template 2: 2-Hour Departure Preparation
- **Subject**: Prepare to Depart for Your Appointment
- **Body**: "Hi {patient_name}, your appointment with {doctor_name} is in 2 hours ({appointment_time}). Current estimated driving time is {travel_mins} mins with {traffic_condition} traffic. Recommended leave-by time: {recommended_departure_time}."

#### Template 3: Live Queue Token Called
- **Subject**: Your Token {token_number} Has Been Called!
- **Body**: "Token {token_number} is now called! Please step into Consultation Room 1 for your appointment with {doctor_name}."

#### Template 4: Doctor Delay Alert
- **Subject**: Schedule Notice: Doctor Delayed by {delay_mins} mins
- **Body**: "Important update: {doctor_name} has reported an OPD delay of {delay_mins} mins due to {reason}. Your expected turn is now adjusted to {new_expected_turn}. Your recommended departure time is updated to {new_departure_time}."

### 3. Patient Notification Preferences
Patients can configure preferences via `patient_app` or `notification_preferences` table:
- Channels: SMS (opt-in/opt-out), WhatsApp (opt-in/opt-out), Push (opt-in/opt-out).
- Quiet hours protection for non-urgent notifications.

