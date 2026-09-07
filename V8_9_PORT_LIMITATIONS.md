# V8.9 — Known Limitations

1. The official source is a **movement plan**, not an audited statement of realized cargo throughput.
2. DWT is vessel design deadweight and must not be called cargo tonnage or multiplied by tariff to estimate revenue.
3. Carrier identity is not guaranteed by the `Đại lý` field. V8.9 shows agent/origin but does not label agent as carrier.
4. Route text is raw authority text; it is not yet normalized to UN/LOCODE or geographic coordinates.
5. Terminal aliases can change. Unknown aliases remain raw and are excluded from terminal KPI until mapped.
6. Monthly/YoY charts depend on backfill depth. Do not interpret missing old months as zero activity.
7. The collector depends on availability and HTML structure of the public Port Authority site; parser diagnostics are therefore retained.
8. Terminal DWT capability is a separate concept from TEU/cargo capacity utilization.
9. Non-Hai-Phong regions remain research targets and are not part of the production collector in V8.9.
