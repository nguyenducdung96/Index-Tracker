# Copy / overwrite — V8.19

Overwrite:
1. `apps/web/src/components/industry/PortIndustryTab.tsx`
2. `apps/web/src/styles.css`
3. `V8_19_REQUIREMENTS.md`
4. `COPY_FILES_V8_19.md`

No D1 migration. No new API key or Cloudflare secret.

After copy:
```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

V8.19 intentionally reuses the existing Hải Phòng official ship-plan collector and D1 history instead of introducing unverified data sources.
