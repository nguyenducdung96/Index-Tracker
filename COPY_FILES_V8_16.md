# Copy / overwrite for V8.16

## OVERWRITE
- apps/web/src/App.tsx
- apps/web/src/api.ts
- apps/web/src/types.ts
- apps/web/src/styles.css
- apps/web/src/components/industry/PortIndustryTab.tsx
- apps/worker/src/index.ts

## NEW
- apps/worker/src/providers/industry/portsNational.ts
- database/migration_v8_16_ports_national.sql
- V8_16_REQUIREMENTS.md
- V8_16_LIMITATIONS.md
- V8_16_NEXT_STEPS.md
- V8_16_RELEASE.md
- COPY_FILES_V8_16.md

## D1
Run `database/migration_v8_16_ports_national.sql` once before future historical ingestion. Current live VIMAWA endpoint works without rows in these tables.
