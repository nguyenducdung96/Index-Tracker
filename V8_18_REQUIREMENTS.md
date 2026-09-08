# V8.18 — National Port Dashboard

## Goal
Rebuild `Cảng > Tổng quan` as a national industry dashboard. Do not mix PHP/GMD/terminal-specific KPIs into National Overview.

## Requirements
1. National official statistics first: VIMAWA statistics archive/workbooks.
2. KPI layer: total cargo, container, export, import, domestic, transit when explicitly available.
3. National throughput trend with Cargo / Container switch.
4. Latest-period cargo mix and YoY where source supports it.
5. Listed-company universe remains a registry; ticker != terminal.
6. Region summary links to Region layer; detailed ship-call stays outside Overview.
7. Every number must retain source/status. No hard-coded fallback.
8. DWT is never cargo throughput or TEU.
9. Parser emits normalized values only when YTD/prior-YTD headers are explicitly recognized.
10. Mobile responsive UI.

## Architecture
Official report -> report discovery -> XLSX parser -> normalized response -> React dashboard.
D1 table `port_national_statistics` is foundation for future persistence/backfill; V8.18 endpoint remains live-source-first.
