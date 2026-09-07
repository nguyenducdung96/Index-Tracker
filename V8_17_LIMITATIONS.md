# V8.17 limitations
- VIMAWA workbook layouts vary. V8.17 recognizes metric rows but intentionally does not assign semantic meaning to each numeric column unless the workbook schema is verified.
- Therefore a historical throughput chart is not fabricated from ambiguous columns. The UI exposes report periods, XLSX availability and parsed raw metric-row coverage first.
- Quang Ninh collector retains raw official table cells because field order may change upstream.
- Quy Nhon sampled detail reports are image-based; V8.17 discovers archive metadata only and does not OCR image rows into official structured records.
- AIS, tariff, SCFI/CCFI and investment forecasting remain out of scope.
