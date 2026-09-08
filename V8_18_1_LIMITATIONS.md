# V8.18.1 Limitations

- Monthly values are DERIVED from official YTD data; they are not labelled as raw monthly observations.
- A month is unavailable when the immediately previous official YTD period cannot be normalized with the same unit/metric.
- VIMAWA workbook layout can vary by period. Parser V2 remains conservative and may intentionally suppress a metric.
- No interpolation or backfilling from third-party sources.
- V8.18.1 does not add AIS, freight indices, tariffs, valuation, or forecasts.
- No new D1 migration is required beyond the V8.18 `port_national_statistics` foundation.
