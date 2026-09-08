# V8.19 — Region Intelligence

## Goal
Turn **Khu vực** into an investment-monitoring layer. National overview answers *where activity is*; Region answers *whether operating momentum is strengthening or weakening*; Company/Terminal explain beneficiaries.

## V8.19 scope
- Production region: **Hải Phòng**, because the repo already has a validated official ship-plan collector and D1 history.
- KPI: DWT proxy, arrival calls, average DWT, max DWT.
- Monthly operating rhythm from D1 history.
- Terminal contribution/share by DWT proxy.
- Daily 90-day activity and fleet profile.
- Explicit provenance and guardrails.

## Data policy
1. Arrival convention only; do not double count arrival/departure.
2. DWT is vessel-size proxy, **not cargo throughput or TEU**.
3. Terminal share is share of normalized arrival DWT in the tracked dataset, **not TEU market share**.
4. Missing source fields remain unavailable. Do not synthesize carrier share or cargo.
5. Other port authorities stay at coverage/research status until their collectors are production validated.

## Official-source expansion
- VIMAWA national port / berth registry (Decision 505/QD-BXD, 17-Apr-2026) is the canonical static berth registry.
- VIMAWA berth pages provide operator, function, annual capacity and max vessel DWT where disclosed.
- Port-authority movement sources are preferred for operating-frequency data.

## Next steps V8.20
- Region selector backed by a common `PortAuthorityRegionAnalytics` API.
- Add production collectors only where official structured/consistent sources exist.
- Add YoY only after same-scope historical coverage is sufficient.
- Add carrier/container-line share only when carrier identity can be normalized from official movement records.
- Link terminal rows to Terminal Intelligence and company ownership graph.
