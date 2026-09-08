# V8.18 copy / overwrite guide

Baseline: V8.17.1 hotfix or your current repo containing V8.17.1.

## Overwrite
- `apps/web/src/components/industry/PortIndustryTab.tsx`
- `apps/web/src/api.ts`
- `apps/web/src/types.ts`
- `apps/web/src/styles.css`
- `apps/worker/src/index.ts`
- `apps/worker/src/providers/industry/portsNationalHistory.ts`

## Add
- `database/migration_v8_18_ports_national_dashboard.sql`
- `V8_18_REQUIREMENTS.md`
- `V8_18_LIMITATIONS.md`
- `V8_18_NEXT_STEPS.md`
- `COPY_FILES_V8_18.md`

## One-time D1 migration
PowerShell (use npx.cmd because your ExecutionPolicy blocks npx.ps1):
`npx.cmd wrangler d1 execute gold-tracker-db --remote --file=database/migration_v8_18_ports_national_dashboard.sql`

## Verify before push
- `npm run build`
- `npm run typecheck`

## Verify after deploy
- `/api/industry/ports/national-dashboard`
- `/api/industry/ports/source-health`
- UI: Ngành > Cảng > Tổng quan
