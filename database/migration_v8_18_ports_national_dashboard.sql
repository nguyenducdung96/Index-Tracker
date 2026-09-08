CREATE TABLE IF NOT EXISTS port_national_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  metric TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  ytd_value REAL,
  prior_ytd_value REAL,
  yoy_pct REAL,
  data_status TEXT NOT NULL DEFAULT 'OFFICIAL',
  source_url TEXT NOT NULL,
  published_date TEXT,
  parser_version TEXT NOT NULL DEFAULT 'v8.18-header-map-1',
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period, metric, source_url)
);
CREATE INDEX IF NOT EXISTS idx_port_national_statistics_period ON port_national_statistics(period);
CREATE INDEX IF NOT EXISTS idx_port_national_statistics_metric ON port_national_statistics(metric);
