# SMART CLINIC OS — PHASE 10 AI SAFETY & CLINICAL GOVERNANCE
## Guardrails, Red-Flag Triage Protocols & Verification Standards

### 1. Ethical AI Principles in Smart Clinic OS

The National Medical Commission (NMC) of India and international healthcare standards dictate that AI systems must remain strictly assistive and advisory:

1. **Zero Autonomous Diagnoses:**
   - The AI engine will never output an unverified diagnostic statement directly to a patient.
   - All AI SOAP notes are created with status `DRAFT`.
   - The system requires a licensed medical doctor to explicitly verify, adjust, and approve the notes before persisting to official medical records.

2. **Zero Autonomous Prescriptions:**
   - The AI will never issue an official digital prescription or dispatch medications autonomously.
   - Prescriptions require registered medical council registration number (MCRN) signing and SHA-256 seal generation by a licensed physician.

---

### 2. Emergency Triage Detection Engine

Every incoming user query into the Healthcare Assistant is pre-screened by the emergency detection rule filter before standard language processing.

#### Red-Flag Symptoms Screened:
- Severe chest pain / pressure radiating to left arm or jaw (Myocardial Infarction indicator)
- Acute shortness of breath / inability to speak in sentences
- Sudden facial drooping, arm weakness, or slurred speech (FAST Stroke indicator)
- Profuse, uncontrolled bleeding
- Unresponsiveness, loss of consciousness, or severe head trauma
- Active suicidal ideation or acute self-harm intentions

#### Immediate Interruption Protocol:
When a red flag is detected:
1. `is_emergency: true` is immediately set.
2. The standard response generator is bypassed.
3. High-priority red banner warning is returned to the user:
   > "EMERGENCY ALERT: Your reported symptoms indicate a potentially life-threatening emergency. Please seek immediate in-person medical care or dial emergency hotlines."
4. Standard emergency contact actions are mounted:
   - National Emergency Helpline: **112**
   - National Ambulance Services: **108**
   - Immediate instruction: *"Do not wait for an online consultation or message reply."*

