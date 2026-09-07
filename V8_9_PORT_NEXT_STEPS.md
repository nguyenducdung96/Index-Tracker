# V8.9 Port Intelligence — Next Steps

## Immediate validation after deployment
1. Confirm `/api/industry/ports/source-preview?offset=0` parses official data.
2. Wait for the 4-hour cron or trigger an authenticated backfill.
3. Confirm `/api/industry/ports/haiphong/summary?days=30` has stored rows.
4. Confirm HTIT/HICT/Tân Vũ/Nam Đình Vũ terminal pages show plausible ship calls.
5. Cross-check several vessel rows against the official Port Authority page.

## Historical backfill
- Automatic: initial 14 days on first collector run.
- Automatic: daily historical chunk of 14 older days.
- Optional immediate backfill: configure `PORT_ADMIN_TOKEN`, then POST batches to `/api/admin/ports/backfill`.
- Backfill at least 13 months before enabling YoY conclusions.

## V8.10 candidate
- True YoY monthly comparison once history is complete.
- Carrier master: vessel -> liner carrier mapping with provenance.
- Better route master: raw place -> UN/LOCODE/country.
- Company-terminal ownership/economic-interest table with effective dates.
- Terminal market share within comparable port cluster.
- Data-break markers for reporting-scope changes.

## Later regions
- Cái Mép/Vũng Tàu official port-authority movement feed.
- Quy Nhơn official movement-plan archive.
- Quảng Ninh official movement-plan/location feed.
- Only add a region after field-level validation comparable to Hai Phong.
