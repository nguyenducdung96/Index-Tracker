# Copy / overwrite for V8.17
OVERWRITE:
- apps/web/src/App.tsx
- apps/web/src/api.ts
- apps/web/src/types.ts
- apps/web/src/components/industry/PortIndustryTab.tsx
- apps/worker/src/index.ts
- apps/worker/package.json

NEW:
- apps/worker/src/providers/industry/portsNationalHistory.ts
- database/migration_v8_17_ports_history.sql
- V8_17_REQUIREMENTS.md
- V8_17_LIMITATIONS.md
- V8_17_NEXT_STEPS.md
- V8_17_RELEASE.md
- COPY_FILES_V8_17.md

Run migration once:
npx wrangler d1 execute gold-tracker-db --remote --file=database/migration_v8_17_ports_history.sql

No new secret is required.
