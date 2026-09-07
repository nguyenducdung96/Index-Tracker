# V8.8 — Port Industry MVP Requirements

## Goal
Build the first reusable Industry Engine module for Market Tracker, using the
Vietnam port sector as the reference implementation. Do not copy a paid data
provider's database. Rebuild the product flow from official/public sources.

## Product structure
Main navigation:
- Gold
- Stocks
- Industry
  - Ports (enabled in V8.8)
  - Fertilizer (future)
  - Oil & Gas (future)
  - Steel (future)
  - Chemicals (future)
  - Rubber (future)

Ports sub-navigation:
1. Overview
2. PHP company dashboard
3. HTIT terminal dashboard
4. Data sources

## V8.8 functional requirements
- Responsive desktop + mobile/PWA.
- Reuse existing VNDIRECT Stock Engine for listed port stocks.
- Show source/provenance next to official metrics.
- Separate company-level operating metrics from terminal/ship-call metrics.
- Provide data-quality warnings and limitations.
- Never treat DWT as actual cargo throughput.
- Never infer revenue by multiplying DWT by a tariff.
- Do not scrape/copy premium datasets from third-party sites.
- Keep Gold/Stocks functionality unchanged.

## Official-source priority
1. Government/maritime authority / legal documents.
2. Listed-company official disclosures and audited/reviewed financials.
3. Official company operational announcements.
4. Public reference sources only as fallback with explicit labeling.

## Initial stock universe
PHP, DVP, DXP, GMD, VSC, PDN.

## Initial PHP metrics
The seed values in V8.8 are from official PHP company announcements:
- 2025 throughput: 42.672 million tonnes
- 2025 container volume: 2.072 million TEU
- 2025 revenue: VND 3,545bn
- 2025 PBT: VND 1,280bn

These metrics are a PHP snapshot, NOT Vietnam-wide port-industry totals.
