# Update V8.8 -> V8.9

## OVERWRITE
1. `apps/web/src/App.tsx`
2. `apps/web/src/api.ts`
3. `apps/web/src/types.ts`
4. `apps/web/src/styles.css`
5. `apps/web/src/components/industry/PortIndustryTab.tsx`
6. `apps/worker/src/index.ts`
7. `apps/worker/src/types.ts`
8. `apps/worker/src/providers/industry/ports.ts`
9. `database/schema.sql`
10. `wrangler.jsonc`

## COPY NEW
11. `apps/worker/src/providers/industry/portsHaiphong.ts`
12. `database/migration_v8_9_ports.sql`
13. `V8_9_PORT_REQUIREMENTS.md`
14. `V8_9_PORT_NEXT_STEPS.md`
15. `V8_9_PORT_LIMITATIONS.md`
16. `V8_9_RELEASE.md`
17. `COPY_FILES_V8_9.md`

## D1
The Worker calls `CREATE TABLE IF NOT EXISTS` automatically, so the migration is not mandatory for deployment.
For explicit/manual setup you may run the SQL from `database/migration_v8_9_ports.sql` once in D1 Console.

## Optional secret for immediate historical backfill
Create Runtime Secret:
`PORT_ADMIN_TOKEN=<your-own-long-random-value>`

This is OPTIONAL. Without it, scheduled ingestion still works.

## Cron
V8.9 adds:
`23 */4 * * *`
for current Hai Phong ship-plan refresh.
The existing daily maintenance cron also backfills 14 historical days per day.

## Deploy
```powershell
git add .
git commit -m "V8.9 add Hai Phong official port intelligence pipeline"
git push origin main
```

## Test after deploy
1. `/api/industry/ports/source-preview?offset=0`
2. `/api/industry/ports/haiphong/summary?days=30`
3. `/api/industry/ports/terminal/HTIT?days=90&months=24`
4. `/api/industry/ports/terminal/HICT?days=90&months=24`

The first D1 dashboard call may initially be empty; the Worker triggers a background 14-day bootstrap when storage is empty.
