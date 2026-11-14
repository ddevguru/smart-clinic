# Smart Clinic OS — Known Operational Boundaries & Future Roadmap

**Document ID:** `SCOS-P11-LIM-015`  
**Scope:** Transparent technical constraints, operational thresholds, and recommended future roadmap items beyond Phase 11.

---

## 1. Known Operational Boundaries

1. **SMS Gateway Provider Fallback:** In sandbox/development environments, OTP delivery defaults to the deterministic sandbox code (`123456`) when external SMS gateway credentials (e.g. Twilio, MSG91) are not present in `.env`. Production environments must configure real SMS provider API keys.
2. **WebRTC Media Relaying (TURN):** Video teleconsultation includes Google's public STUN servers for peer-to-peer connection establishment (`stun:stun.l.google.com:19302`). For symmetric enterprise firewalls or cellular carriers with strict NAT, a dedicated coturn / Xirsys TURN relay server is recommended.
3. **Storage Tiering for High-Res Medical Scans:** High-resolution DICOM CT/MRI scans (> 100MB) currently store to local `/storage/records/` volumes. For enterprise hospital networks, migrating to S3 Glacier / Google Cloud Storage with presigned direct uploads is recommended.
4. **Google Maps Distance Matrix API Quota:** Traffic-aware departure estimation uses real distance matrix calculations with a local fallback algorithm when Google Maps API credits are exhausted or offline.

---

## 2. Post-Launch Roadmap (Phase 12+ Explorations)

1. **Native iOS App Distribution:** Porting existing Flutter patient codebase to Apple App Store with Apple HealthKit bidirectional synchronization.
2. **On-Premise Hospital PACS Integration:** Direct HL7 / DICOM server listeners for high-volume radiology departments.
3. **Multi-Region Active-Active Database Replication:** Utilizing PostgreSQL logical replication across geographically distinct data centers (e.g. Mumbai and Bengaluru).

