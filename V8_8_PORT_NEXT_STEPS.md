# Port Industry — Next Steps

## Phase 2 — Official ship-call/DWT pipeline
Target:
- Find a stable public official source from maritime/port authorities.
- Capture: date, vessel, IMO if available, DWT, terminal, arrival/departure,
  shipping line, route/agent.
- Normalize into D1.
- Aggregate daily/monthly/quarterly/YoY.
- Add data-break markers when authority boundaries or reporting scope changes.

Do NOT automate against paid third-party pages.

## Phase 3 — Terminal Intelligence
- HTIT / Tân Vũ / Chùa Vẽ / Hoàng Diệu.
- DWT by month/quarter.
- Ship count.
- Large-vessel count.
- Shipping-line retention/new/lost.
- Route mix.
- Market share within comparable port cluster.

## Phase 4 — Company Financial Intelligence
- Parse official quarterly/annual statements.
- Revenue, gross profit, gross margin, PBT, NPAT, EPS, ROE.
- Operating vs financial momentum.
- Reconcile quick operational announcements against audited/reviewed filings.

## Phase 5 — Capacity & expansion
- Designed capacity.
- Actual TEU/tonnage where officially disclosed.
- Utilization only when numerator/denominator definitions match.
- New berth projects, construction status, COD.
- Ownership/operator mapping.

## Phase 6 — Sector-wide expansion
Add GMD, VSC, DVP, DXP, PDN, CDN and other listed port companies.
Then create:
- North / Central / South dashboard
- company comparison
- capacity pipeline
- price/tariff tracker
- import/export macro overlay

## Industry Engine reuse
After Ports is stable, reuse:
industries -> indicators -> sources -> values -> companies -> events
for Fertilizer, Oil & Gas, Steel, Chemicals, Rubber, Paper, etc.
