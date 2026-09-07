CREATE TABLE IF NOT EXISTS port_national_report_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT,
  title TEXT NOT NULL,
  page_url TEXT NOT NULL UNIQUE,
  xlsx_url TEXT,
  published_date TEXT,
  parser_version TEXT,
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_port_national_report_period ON port_national_report_registry(period);
CREATE TABLE IF NOT EXISTS port_source_health (
  source_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  latest_period TEXT,
  last_success TEXT,
  last_checked TEXT NOT NULL,
  note TEXT
);
