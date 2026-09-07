# Update V8.10 -> V8.11

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
9. V8_11_REQUIREMENTS.md
10. V8_11_LIMITATIONS.md
11. V8_11_NEXT_STEPS.md
12. V8_11_RELEASE.md
13. COPY_FILES_V8_11.md

## No change
- database/schema.sql
- database/migration_v8_9_ports.sql
- wrangler.jsonc
- Cloudflare secrets
- Gold providers
- VNDIRECT stock providers
- Watchlist / Stock Detail

## Deploy
git add .
git commit -m "V8.11 add port history ownership and company comparison"
git push origin main

## Test after deploy
/api/industry/ports/history-status
/api/industry/ports/relationships
/api/industry/ports/relationships?symbol=VSC
/api/industry/ports/company-comparison?days=90&months=24
/api/industry/ports/company/VSC?days=90&months=24
/api/industry/ports/company/DVP?days=90&months=24
/api/industry/ports/company/HAH?days=90&months=24
/api/industry/ports/company/DXP?days=90&months=24
