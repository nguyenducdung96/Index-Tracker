# Next steps after V8.18.2

1. Deploy and call `/api/industry/ports/national-dashboard`.
2. Confirm `status=NORMALIZED`, `sourceMode=D1|LIVE`, and inspect `diagnostics` when PARTIAL.
3. Let the daily 03:00 cron persist newly validated reports into D1.
4. V8.19: Regional Port Intelligence only after National monthly/YTD series is production-stable.
5. Later: R2 raw-source archive + parser regression fixtures.
