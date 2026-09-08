# V8.18.3 limitations

- VIMAWA archive mixes XLSX and DOCX. V8.18.3 normalizes verified XLSX only. DOCX periods are surfaced as discovered coverage, not invented values.
- VIMAWA currently lists 2026-06 plus historical 2025/2024 reports; a complete monthly 2026 official series is not present on the statistics listing. Missing months remain gaps.
- Monthly values require two consecutive normalized YTD reports. A standalone June report cannot produce June monthly throughput without May YTD of the same scope.
- The UI must not interpret DWT/ship calls as national cargo throughput.
