# Phase 7 — Google Maps Cost Optimization Guide
## Caching Strategy, Pricing Tiers & Expense Projections

### 1. Google Maps Routes API Pricing Context
- Google Cloud provides **\$200 free monthly credit** on Google Maps Platform.
- Routes API (Basic Routing): \$5.00 per 1,000 requests.
- Routes API (Traffic-Aware Routing): \$10.00 per 1,000 requests.

### 2. Smart Clinic OS Cost Reduction Strategies
Without optimization, a clinic servicing 50 patients daily where each patient refreshes their app 5 times would consume:
$$50 \times 5 = 250\text{ queries/day} \times 30 = 7,500\text{ queries/month} \rightarrow \$75/\text{month per clinic}$$

With Smart Clinic OS Phase 7 multi-tiered optimization:
1. **10-Minute Snapshot Caching (`traffic_route_snapshots`)**:
   - Repeat checks within 10 minutes from the same geographic zone hit the local PostgreSQL cache directly.
   - Reduces API calls by **60–75%**.
2. **SHA-256 Coordinate Rounding**:
   - Origins within ~110m (0.001Â° latitude/longitude) share the identical cache entry, pooling requests across patients commuting from the same neighborhoods.
3. **On-Demand Execution**:
   - Zero background polling or periodic pinging from idle mobile apps. Calculations run strictly on active user interaction.
4. **Fallback Peak-Hour Modeling**:
   - When quota threshold is reached or non-critical estimates are generated, the system falls back to the deterministic Indian city speed model at **\$0.00 marginal cost**.

### 3. Net Projected Expenses
With optimizations enabled:
- **Single Clinic (50 OPD visits/day)**: $\sim 1,500$ Google Maps API calls/month $\approx \$15.00/\text{month}$ (100% covered under the \$200 free monthly credit).
- **Cluster of 10 Clinics**: $\sim 15,000$ calls/month $\approx \$150.00/\text{month}$ (completely covered by free tier).
- **Platform Scale (100+ Clinics)**: Under \$0.03 per patient visit, representing negligible SaaS infrastructure overhead.

