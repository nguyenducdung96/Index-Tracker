# V8.18.2 — Official Data Ingestion Hardening

## Goal
Fix the VIMAWA runtime parser so National Port Dashboard can consume official national maritime statistics without guessed fields.

## Requirements
1. Reconstruct XLSX merged cells and multi-row headers before semantic mapping.
2. Separate maritime/cảng biển scope from inland-waterway scope.
3. Normalize only TOTAL/CONTAINER/EXPORT/IMPORT/DOMESTIC/TRANSIT.
4. YTD and prior-YTD must be recognized from header semantics; ambiguous rows are suppressed.
5. Monthly = current YTD minus immediately previous official YTD only when metric/unit match.
6. Persist validated records into existing `port_national_statistics`.
7. Daily scheduled ingest reuses the existing 03:00 cron; no extra cron trigger is required.
8. Dashboard reads D1 first once normalized records exist; live VIMAWA parsing is bootstrap/fallback.
9. Manual refresh is protected by existing `PORT_ADMIN_TOKEN` if configured.
10. No fake/fallback KPI when official parser validation fails.
