# V8.15 — Company & Asset Portfolio Rebuild

## Goal
Rebuild Company Detail around a clean hierarchy: Company → Asset Portfolio → Terminal detail. GMD is the reference implementation.

## GMD scope
- 6 official Ports & ICDs: Nam Dinh Vu, Nam Hai ICD, Gemadept Dung Quat, Phuoc Long ICD, Binh Duong Port, Gemalink.
- Explicit asset types: DEEP_SEA_PORT / SEAPORT / RIVER_PORT / ICD / FLOATING_PORT / AIR_CARGO.
- Ownership shown only where official disclosure is available.
- Capacity and expansion timeline kept separate from actual throughput.
- SCSC remains related ecosystem / AIR_CARGO, outside Port & ICD peer comparison.
- Company page does not duplicate terminal ship-call/route/DWT analytics.

## Data guardrails
Official-source first. No interpolation of ownership, capacity, throughput or market share. System capacity is not allocated back to assets. DWT is not TEU/cargo.
