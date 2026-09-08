# V8.18.1 — Monthly Throughput & YoY Consistency

## Goal
Fix the invalid National Throughput Trend that placed unlike YTD periods (for example 2025-05 beside 2026-06) on one chart, and provide a monthly view with YoY comparison.

## Requirements
1. Trend has metric switch: Cargo / Container.
2. Trend has basis switch: Monthly / YTD.
3. Trend has year selector.
4. Monthly value is calculated only from consecutive official YTD reports:
   `monthly(m) = YTD(m) - YTD(m-1)`.
5. Prior-year monthly value is derived from the prior-YTD columns in those same official reports.
6. January may use YTD January as the monthly value.
7. Missing consecutive month => monthly value unavailable. Never interpolate.
8. YTD comparison always uses current YTD and prior-year YTD from the same official workbook / same month scope.
9. Show YoY per month / per YTD point.
10. Published date must come from VIMAWA statistics listing `Ngày cập nhật`, never the portal footer licence date 29/12/2003.
11. Suppress ambiguous national metric rows instead of choosing among equally plausible values.
12. Preserve the V8.18 National Overview hierarchy. No new Company/Terminal analytics in this hotfix.
