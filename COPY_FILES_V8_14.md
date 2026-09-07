# Update current V8.13 repo -> V8.14

## OVERWRITE
1. apps/web/src/App.tsx
2. apps/web/src/types.ts
3. apps/web/src/styles.css
4. apps/web/src/components/industry/PortIndustryTab.tsx
5. apps/worker/src/types.ts
6. apps/worker/src/providers/industry/ports.ts

## COPY NEW DOCS
7. V8_14_REQUIREMENTS.md
8. V8_14_LIMITATIONS.md
9. V8_14_NEXT_STEPS.md
10. V8_14_RELEASE.md
11. COPY_FILES_V8_14.md

## NO CHANGE
- apps/worker/src/providers/industry/portsHaiphong.ts
- database/schema.sql
- database/migration_v8_9_ports.sql
- wrangler.jsonc
- Cloudflare secrets
- Gold module
- Stocks / Watchlist / Stock Detail

## Test
- Header = V8.14
- Ngành > Cảng: top tabs only Tổng quan / Khu vực / Doanh nghiệp / Terminal / Nguồn dữ liệu
- Tổng quan contains no PHP KPI and no realtime stock strip
- Khu vực > Hải Phòng still loads existing collector data
