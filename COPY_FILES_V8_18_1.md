# Copy / overwrite — V8.18 -> V8.18.1

## OVERWRITE
- apps/web/src/App.tsx
- apps/web/src/types.ts
- apps/web/src/styles.css
- apps/web/src/components/industry/PortIndustryTab.tsx
- apps/worker/src/index.ts
- apps/worker/src/providers/industry/portsNationalHistory.ts

## NEW / OPTIONAL DOCS
- V8_18_1_REQUIREMENTS.md
- V8_18_1_LIMITATIONS.md
- V8_18_1_NEXT_STEPS.md
- COPY_FILES_V8_18_1.md

## D1
No new migration. Do NOT rerun V8.17 migrations. If `migration_v8_18_ports_national_dashboard.sql` has already been executed, no DB action is needed for V8.18.1.

## Local validation
```powershell
npm.cmd install
npm.cmd run build
npm.cmd run typecheck
```

## Deploy
```powershell
git add .
git commit -m "V8.18.1 monthly throughput and YoY consistency"
git push origin main
```
