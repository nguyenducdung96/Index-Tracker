# Copy V8.9 -> V8.10

## Overwrite
- apps/web/src/App.tsx
- apps/web/src/api.ts
- apps/web/src/types.ts
- apps/web/src/styles.css
- apps/web/src/components/industry/PortIndustryTab.tsx
- apps/worker/src/index.ts
- apps/worker/src/types.ts
- apps/worker/src/providers/industry/portsHaiphong.ts

## New tracking docs (root)
- V8_10_RELEASE.md
- V8_10_NEXT_STEPS.md
- V8_10_LIMITATIONS.md
- COPY_FILES_V8_10.md

## No change required
- database/schema.sql
- database/migration_v8_9_ports.sql
- wrangler.jsonc
- Cloudflare secrets

No new D1 migration is required for V8.10.
