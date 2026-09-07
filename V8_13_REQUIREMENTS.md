# V8.13 Requirements — Historical Throughput Intelligence

## Goal
Turn V8.12's point-in-time throughput/capacity layer into a provenance-first historical registry.

## Included
- Historical throughput points with explicit scope, period, unit and ACTUAL/ESTIMATE/TARGET.
- Capacity timeline with effective dates and comparator (`=`, `>`, `>=`).
- Company filters and responsive mobile cards.
- PHP historical actual TEU: 2024, 2025, H1/2026 and May/2026.
- DVP 2025 actual equivalent throughput.
- HAH 2024 actual port-operations TEU + 2025 target.
- GMD 9M/2025 and FY2025 system-wide actual disclosures.
- DXP 2023 actual / 2024 target in TONNES (never converted to TEU).
- HTIT and Nam Dinh Vu capacity timeline.

## Data rules
- Official company/official port sources only.
- Scope is preserved; system-wide figures are not presented as terminal figures.
- Actual, estimate and target remain different data types.
- TEU and tonnes are never converted into each other.
- DWT is not throughput.
- Conflicting wording is surfaced as a limitation, not silently reconciled.
