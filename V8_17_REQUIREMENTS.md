# V8.17 — Historical Port Data & Multi-Region Collectors

## Scope
- Discover official VIMAWA monthly statistics reports and XLSX attachments.
- Parse XLSX conservatively: retain raw numeric arrays for recognized metric rows; never guess changing workbook column meanings.
- Add national history/report visibility to Port Overview.
- Add Quang Ninh official movement-plan collector endpoint.
- Add Quy Nhon official archive discovery without OCR.
- Add source-health endpoint/UI.
- Keep V8.16 national current stats, Hai Phong collector, GMD portfolio and all non-port tabs unchanged.

## Data policy
Official source first. A missing or changed source returns PARTIAL/SOURCE_UNAVAILABLE. No synthetic throughput, DWT, terminal allocation, or guessed XLSX columns.
