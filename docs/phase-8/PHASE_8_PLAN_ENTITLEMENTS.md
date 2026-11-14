# SMART CLINIC OS — PHASE 8 PLAN ENTITLEMENTS
## Resource Limits, Feature Gates & Enforcement Engine

---

## 1. Plan Comparison Matrix

| Feature / Resource Limit | Free Trial (`TRIAL`) | Basic Clinic (`BASIC`) | Professional Suite (`PRO`) | Enterprise Network (`ENTERPRISE`) |
|:---|:---:|:---:|:---:|:---:|
| **Monthly Pricing** | ₹0 | ₹1,999 + 18% GST | ₹4,999 + 18% GST | ₹12,999 + 18% GST |
| **Annual Pricing (20% off)** | — | ₹19,990 + 18% GST | ₹49,990 + 18% GST | ₹1,29,990 + 18% GST |
| **Evaluation Period** | 14 Days | Ongoing | Ongoing | Ongoing (30d initial) |
| **Maximum Branches** | 1 | 1 | 3 | 10 (or Custom) |
| **Maximum Doctors** | 1 | 2 | 6 | 25 (or Custom) |
| **Maximum Staff Accounts** | 2 | 3 | 10 | 50 (or Custom) |
| **Monthly Appointments** | 100 | 300 | 1,500 | Unlimited (-1) |
| **Storage Limit** | 1 GB | 5 GB | 25 GB | 100 GB |
| **Digital Prescriptions** | Yes | Yes | Yes | Yes |
| **Electronic Health Records** | Yes | Yes | Yes | Yes |
| **Automated Queue Alerts** | Yes | Yes | Yes | Yes |
| **Automated Reminders** | Yes | Yes | Yes | Yes |
| **Traffic Departure Engine** | No | No | **Yes** | **Yes** |
| **Advanced Revenue Analytics** | No | No | **Yes** | **Yes** |
| **24/7 Dedicated Support** | No | No | No | **Yes** |

---

## 2. Resource Limit Enforcement

All resource calculations are dynamically evaluated against the PostgreSQL database:
- `MAX_BRANCHES`: Evaluated via `SELECT count(*) FROM clinic_branches WHERE clinic_id = $1 AND is_active = true`.
- `MAX_DOCTORS`: Evaluated via `SELECT count(*) FROM doctor_profiles WHERE clinic_id = $1 AND is_active = true`.
- `MAX_STAFF`: Evaluated via `SELECT count(*) FROM clinic_memberships WHERE clinic_id = $1 AND status = 'ACTIVE'`.
- `MAX_MONTHLY_APPOINTMENTS`: Evaluated via `SELECT count(*) FROM appointments WHERE clinic_id = $1 AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)`.

When an action would exceed the subscribed limit, the server responds with:
```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "Doctor limit reached (2/2). Upgrade to Professional or Enterprise to add more doctors.",
    "current": 2,
    "max": 2
  }
}
```

---

## 3. Boolean Feature Gate Checking

Premium feature gates are verified before executing premium capabilities:
```javascript
const trafficAllowed = await SubscriptionService.checkEntitlement(clinicId, 'TRAFFIC_INTELLIGENCE');
if (!trafficAllowed.allowed) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FEATURE_UNAVAILABLE',
      message: 'Google Maps Traffic Departure Intelligence requires a Professional or Enterprise subscription plan.'
    }
  });
}
```

