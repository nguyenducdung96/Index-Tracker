# V8.18.3 — National Overview correctness

Scope is intentionally limited to **Ngành > Cảng > Tổng quan**.

## Requirements
1. National KPIs use VIMAWA official statistics only.
2. Missing/parse failure must be `null` and UI renders `—`; never synthesize 0 or -100% YoY.
3. XLSX parser expands merged cells and reconstructs multi-row header context before mapping YTD/prior-YTD.
4. Equal-confidence conflicting rows are suppressed.
5. Monthly trend is derived only from consecutive normalized YTD periods with same metric/unit.
6. YoY monthly compares derived month with prior-year month from official prior-YTD fields.
7. Statistics listing date is the publication/update date; footer licence date is ignored.
8. DOCX historical reports are discovered and classified, but are not silently parsed as XLSX.
9. API exposes parserVersion, coverage and diagnostics for audit/debug.
10. No region/company/terminal feature expansion in this version.
