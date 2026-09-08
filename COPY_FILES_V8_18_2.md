# Update V8.18.1 -> V8.18.2

## OVERWRITE
- apps/web/src/App.tsx
- apps/web/src/components/industry/PortIndustryTab.tsx
- apps/worker/src/index.ts
- apps/worker/src/providers/industry/portsNationalHistory.ts
- tong_hop_nguon_du_lieu_cang_bien.md

## NEW docs
- V8_18_2_REQUIREMENTS.md
- V8_18_2_LIMITATIONS.md
- V8_18_2_NEXT_STEPS.md
- COPY_FILES_V8_18_2.md

## D1
No new migration. V8.18 table `port_national_statistics` is reused.

## Secrets
No new secret. Optional manual refresh endpoint uses the existing `PORT_ADMIN_TOKEN` if already configured.

## Validate
```powershell
npm.cmd run build
npm.cmd run typecheck
```

## Deploy
```powershell
git add .
git commit -m "V8.18.2 harden official port data ingestion"
git push origin main
```
