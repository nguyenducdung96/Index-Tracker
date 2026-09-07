# Update V8.12 -> V8.13

## OVERWRITE
1. apps/web/src/App.tsx
2. apps/web/src/api.ts
3. apps/web/src/types.ts
4. apps/web/src/styles.css
5. apps/web/src/components/industry/PortIndustryTab.tsx
6. apps/worker/src/index.ts
7. apps/worker/src/types.ts
8. apps/worker/src/providers/industry/portsHaiphong.ts

## COPY NEW docs
9. V8_13_REQUIREMENTS.md
10. V8_13_LIMITATIONS.md
11. V8_13_NEXT_STEPS.md
12. V8_13_RELEASE.md
13. COPY_FILES_V8_13.md

## No change
- database/schema.sql
- database/migration_v8_9_ports.sql
- wrangler.jsonc
- Cloudflare secrets
- Gold providers
- VNDIRECT providers
- Watchlist / Stock Detail

## Test after deploy
/api/industry/ports/throughput-capacity
/api/industry/ports/throughput-history
/api/industry/ports/company-comparison?days=90&months=24

UI:
Ngành -> Cảng -> Throughput
Check Historical Throughput Registry + Capacity Timeline on desktop and mobile.
