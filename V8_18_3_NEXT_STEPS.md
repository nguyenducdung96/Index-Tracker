# Next steps after V8.18.3

Do not start Region/Company/Terminal until the National Overview passes production validation.

1. Deploy and inspect `/api/industry/ports/national-dashboard`.
2. Confirm `parserVersion=v8.18.3-null-safe-merged-header-1`.
3. Review `coverage` and `diagnostics` against VIMAWA report attachments.
4. If XLSX metrics normalize correctly, persist validated series to D1 ingestion job.
5. Add a dedicated DOCX table parser only after verifying the exact official document structure across 2024-2025; do not use OCR or heuristic number picking.
6. Once National KPI + monthly/YoY are trustworthy, freeze Tổng quan and move to Khu vực in the next major step.
