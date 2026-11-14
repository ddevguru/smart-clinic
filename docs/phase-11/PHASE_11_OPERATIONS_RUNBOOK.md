# Smart Clinic OS — Operations & Incident Response Runbook

**Document ID:** `SCOS-P11-OPS-013`  
**Classification:** DevOps / SRE Standard Operating Procedures (SOP)  
**Emergency Contacts:** SRE On-Call, Database Administrator, Security Response Team

---

## 1. Daily Operations & Routine Checks

| Schedule | Task | Command / Action |
| :--- | :--- | :--- |
| **Every 15s** | API Health & Pool Latency | Automated Prometheus scrape (`GET /metrics`) |
| **Hourly** | Database Backup Snapshot | `deploy/backup.sh` (Triggered via cron) |
| **Daily (02:00 IST)** | Automated DB Maintenance | `vacuumdb -U postgres -d smart_clinic_os --analyze` |
| **Weekly (Sunday 03:00 IST)**| Comprehensive Backup Verification | Automated test restore to scratch sandbox DB |

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: Service Restart & Container Recovery
```bash
# Check status of all containers
docker compose ps

# Restart specific service without interrupting other containers
docker compose restart backend
docker compose restart frontend
docker compose restart proxy
```

### SOP-02: Inspecting Live Production Logs
```bash
# Stream API logs with request IDs
docker compose logs -f --tail=100 backend

# Filter for errors or warnings
docker compose logs --tail=500 backend | grep -iE 'error|fatal|exception'

# Inspect Nginx access and rate-limit logs
docker compose logs -f --tail=100 proxy
```

### SOP-03: Handling High Queue Delay Alerts
1. Open Clinic Owner / Receptionist dashboard.
2. Check if a doctor's consultation duration has spiked or doctor arrived late.
3. Automated delay intelligence will automatically adjust patient departure recommendations.
4. If required, receptionist can reassign waiting tokens to an available doctor in the same specialty via the live queue console.

---

## 3. Incident Response Playbooks

### Playbook P1: Database Connection Saturation (`scos_db_pool_waiting_clients > 5`)
1. **Diagnosis:** Run query to inspect active locking transactions:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
     AND state != 'idle';
   ```
2. **Immediate Action:** Terminate orphaned long-running statements:
   ```sql
   SELECT pg_cancel_backend(pid);
   ```
3. **Escalation:** If pool remains saturated, increase `max` pool size in `.env` (`DB_POOL_MAX=50`) and restart backend.

### Playbook P2: Payment Webhook Failure / Retry Spike
1. **Diagnosis:** Inspect webhook error table:
   ```sql
   SELECT * FROM payment_webhook_events WHERE status != 'PROCESSED' ORDER BY created_at DESC LIMIT 20;
   ```
2. **Verification:** Confirm that Razorpay HMAC webhook secret in `.env` matches the Razorpay dashboard settings.
3. **Replay:** Razorpay will automatically retry failed deliveries with exponential backoff. Our idempotent handler will process them without double billing.

### Playbook P3: Emergency System Recovery (Hardware / VPS Failure)
1. Provision new server instance.
2. Clone repository and configure `.env`.
3. Pull latest encrypted backup from S3:
   ```bash
   aws s3 cp s3://scos-backups/latest.dump /opt/smart-clinic-os/
   ```
4. Restore database using `./deploy/restore.sh latest.dump`.
5. Point DNS A-records to new VPS IP. Complete RTO < 5 minutes.

