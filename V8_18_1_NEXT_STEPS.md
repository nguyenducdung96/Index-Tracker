# Next steps after V8.18.1

1. Validate `/api/industry/ports/national-dashboard` against the official XLSX for each normalized period.
2. Persist validated monthly/YTD normalized values into `port_national_statistics` through a controlled ingest job.
3. Add historical coverage diagnostics: missing months, parser version, source publication date and raw file reference.
4. Only after national monthly history is stable, move to Regional Port Intelligence (V8.19).
