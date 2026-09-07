# V8.16 limitations
- `/national-stats` parses the current official VIMAWA HTML table at request time. If the upstream HTML changes, API returns SOURCE_UNAVAILABLE rather than stale invented values.
- VIMAWA XLSX source is verified, but automatic XLSX historical ingestion is not enabled in V8.16.
- Quy Nhơn and Quảng Ninh movement-plan sources are registered as PROTOTYPE_READY; V8.16 does not yet normalize their records into D1.
- Hải Phòng remains the only granular production ship-plan collector.
- National/authority aggregates must not be allocated to individual companies or terminals.
- No AIS persistent WebSocket is enabled.
