# PHASE 9 — PROVIDER AVAILABILITY & TRAVEL BUFFER ENGINE

## 1. Operating Model

Unlike clinic-based consultations where patients queue in a waiting room, home healthcare requires consideration of **travel time**, **traffic delays**, and **equipment sterilization**.

Smart Clinic OS enforces a multi-tier availability validation engine before allowing any booking to be scheduled.

---

## 2. Daily Booking Quotas & Time Boundaries

1. **Working Hours:**
   - Default operating window: 09:00 to 18:00 (Monday through Saturday).
   - Bookings outside provider shift hours are automatically rejected with:
     `"Requested time is outside provider operating hours."`
2. **Daily Visit Quota:**
   - Default limit: **6 visits per day** per professional.
   - Prevents clinical burnout and ensures unhurried patient care.
   - When quota is reached:
     `"Provider has reached maximum daily home visit capacity (6 visits) on this date."`

---

## 3. Travel & Preparation Buffer Conflict Detection

Every scheduled visit requires travel before and after the appointment.

The availability engine automatically applies a **30-minute buffer window** around existing bookings:

$$\text{Blocked Interval} = [\text{start\_time} - \text{buffer}, \quad \text{end\_time} + \text{buffer}]$$

### Conflict Detection Algorithm
```javascript
for (const booking of existingBookings) {
  const bStart = booking.start_minutes - buffer;
  const bEnd = booking.end_minutes + buffer;

  if (newStartMinutes < bEnd && newEndMinutes > bStart) {
    return {
      available: false,
      reason: "Time slot conflict: Provider has an overlapping commitment around " + booking.start_time + " including travel buffer."
    };
  }
}
```

This prevents back-to-back overlaps and guarantees that the provider can travel between patient homes comfortably.

