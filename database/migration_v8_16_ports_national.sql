CREATE TABLE IF NOT EXISTS port_authority_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT, authority_code TEXT NOT NULL, authority_name TEXT NOT NULL,
  period TEXT NOT NULL, ship_calls INTEGER, gt_total REAL, domestic_calls INTEGER, foreign_calls INTEGER,
  cargo_tons REAL, container_teu REAL, passengers REAL, source_url TEXT NOT NULL, source_date TEXT,
  scope_version TEXT NOT NULL DEFAULT 'vimawa-current', fetched_at TEXT NOT NULL,
  UNIQUE(authority_code, period, source_url)
);
CREATE INDEX IF NOT EXISTS idx_port_authority_stats_period ON port_authority_stats(period);
CREATE INDEX IF NOT EXISTS idx_port_authority_stats_authority ON port_authority_stats(authority_code, period);
CREATE TABLE IF NOT EXISTS port_ingest_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
  status TEXT NOT NULL, rows_written INTEGER NOT NULL DEFAULT 0, parser_version TEXT, error TEXT
);
CREATE TABLE IF NOT EXISTS port_data_breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, authority_code TEXT NOT NULL, effective_date TEXT NOT NULL,
  description TEXT NOT NULL, source_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
