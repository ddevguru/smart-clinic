# Smart Clinic OS — Phase 4 Booking & Scheduling Rules

### 1. Fixed Slot Generation & Boundaries
1. **Schedule Boundary**: Appointment slots are only generated during doctor working hours defined in `DoctorSchedule` for the branch and day of week.
2. **Break Windows**: Slots overlapping with break times (`break_start_time` to `break_end_time`) are marked `is_available: false` with `reason: "BREAK"`.
3. **Double-Booking Prevention**:
   - Evaluated during query time and re-validated inside the transactional boundary with `with_for_update()`.
   - Any attempt to commit an appointment for an occupied doctor slot raises `ConflictError` (HTTP 409).
4. **Cancelled Slot Release**: When an appointment is cancelled (`status = "CANCELLED"`), the slot is immediately released and becomes available for re-booking.

---

### 2. Live Queue & Walk-In Ordering Rules
1. **Unified Ordering**: All walk-in and online live-queue entries are inserted into one unified chronological sequence.
2. **Daily Counter Reset**: Token counters reset daily at midnight (or upon first registration of the calendar date) per branch and doctor.
3. **Capacity Constraints**: Total active registrations are bounded by `QueuePolicy.max_daily_capacity` (default: 80).
4. **Duplicate Prevention**: A patient cannot hold multiple active tickets (`WAITING`, `CALLED`, `IN_CONSULTATION`) for the same doctor on the same date.

---

### 3. Priority and Emergency Handling
1. **Healthcare Safety Mandate**:
   - Automatic classification of severe emergency cases is strictly forbidden. Medical emergencies must immediately follow clinic hospital protocols.
   - Clinical or administrative staff can manually flag a ticket as `priority_flag = true`.
2. **Priority Ordering**:
   - Priority tickets are prioritized ahead of standard sequential tickets in `CALL NEXT` queries (`ORDER BY priority_flag DESC, token_sequence ASC`).
   - A mandatory justification reason is required and audited in `QueueStateHistory`.

