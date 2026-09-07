# Update V8.7 -> V8.8

## OVERWRITE
1. apps/web/src/App.tsx
2. apps/web/src/api.ts
3. apps/web/src/types.ts
4. apps/web/src/styles.css
5. apps/worker/src/index.ts
6. apps/worker/src/types.ts

## COPY NEW
7. apps/web/src/components/industry/IndustryTab.tsx
8. apps/web/src/components/industry/PortIndustryTab.tsx
9. apps/worker/src/providers/industry/ports.ts

## Documentation — COPY NEW
10. V8_8_PORT_REQUIREMENTS.md
11. V8_8_PORT_NEXT_STEPS.md
12. V8_8_PORT_LIMITATIONS.md
13. V8_8_RELEASE.md
14. COPY_FILES_V8_8.md

## No change
- database/schema.sql
- wrangler.jsonc
- Cloudflare secrets
- Gold providers
- StocksTab / WatchlistPanel / StockDetailView
- VNDIRECT stock providers

## Deploy
git add .
git commit -m "V8.8 add Port Industry MVP"
git push origin main

Cloudflare:
Build command: npm run build
Deploy command: npx wrangler deploy

After deploy:
- Header shows V8.8
- Main nav has `Ngành`
- Ngành -> Cảng loads Overview/PHP/HTIT/Nguồn dữ liệu
- Test API:
  /api/industry/ports/overview
  /api/industry/ports/sources
