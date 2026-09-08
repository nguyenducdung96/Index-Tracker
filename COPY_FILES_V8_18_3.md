# Files to copy/overwrite — V8.18.3

Overwrite:
- `apps/worker/src/providers/industry/portsNationalHistory.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/industry/PortIndustryTab.tsx`

Add docs:
- `V8_18_3_REQUIREMENTS.md`
- `V8_18_3_LIMITATIONS.md`
- `V8_18_3_NEXT_STEPS.md`
- `COPY_FILES_V8_18_3.md`

No new D1 migration and no new secret are required.

Validation:
```powershell
npm.cmd install
npm.cmd run build
npm.cmd run typecheck
```

After deploy inspect:
`/api/industry/ports/national-dashboard`

Expected fields: `status`, `parserVersion`, `latestPeriod`, `coverage`, `diagnostics`, `trend`.
