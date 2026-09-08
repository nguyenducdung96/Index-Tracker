# V8.18 Limitations

- VIMAWA workbook layouts vary. V8.18 intentionally returns PARTIAL instead of guessing columns.
- National statistics cannot be allocated to a listed company or terminal without an explicit source mapping.
- Historical archive completeness depends on official pages/files being reachable.
- D1 `port_national_statistics` is created as persistence foundation; automatic scheduled persistence/backfill is deferred.
- Quảng Ninh remains conservative structured prototype; Quy Nhơn remains metadata-only where source details are image-based.
- No AIS, paid data, OCR-derived official values, valuation, freight index or tariff model in V8.18.
