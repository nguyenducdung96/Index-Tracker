PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS world_gold_history (
  ts INTEGER PRIMARY KEY,
  price REAL NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_world_gold_ts
ON world_gold_history(ts);

CREATE TABLE IF NOT EXISTS vn_gold_latest (
  brand TEXT NOT NULL,
  product TEXT NOT NULL,
  product_name TEXT NOT NULL,
  buy REAL NOT NULL,
  sell REAL NOT NULL,
  source_url TEXT NOT NULL,
  source_kind TEXT,
  verification_state TEXT,
  verification_sources TEXT,
  quality_state TEXT,
  quality_reason TEXT,
  deviation_pct REAL,
  consensus_price REAL,
  observed_at TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (brand, product)
);

CREATE TABLE IF NOT EXISTS vn_gold_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  brand TEXT NOT NULL,
  product TEXT NOT NULL,
  product_name TEXT NOT NULL,
  buy REAL NOT NULL,
  sell REAL NOT NULL,
  source_url TEXT NOT NULL,
  source_kind TEXT,
  verification_state TEXT
);

CREATE INDEX IF NOT EXISTS idx_vn_gold_history_lookup
ON vn_gold_history(brand, product, ts);

CREATE TABLE IF NOT EXISTS provider_status (
  brand TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fx_latest (
  pair TEXT PRIMARY KEY,
  value REAL NOT NULL,
  observed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cron_log (
  job TEXT PRIMARY KEY,
  last_run_at INTEGER NOT NULL,
  last_ok_at INTEGER,
  last_error TEXT
);


CREATE TABLE IF NOT EXISTS stock_watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_watchlist_symbols (
  watchlist_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (watchlist_id, symbol),
  FOREIGN KEY (watchlist_id) REFERENCES stock_watchlists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stock_watchlist_symbols
ON stock_watchlist_symbols(watchlist_id, sort_order);


-- V8.9 Port Industry / Hai Phong official ship-plan pipeline

CREATE TABLE IF NOT EXISTS port_ship_movements (
  row_key TEXT PRIMARY KEY,
  plan_date TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  event_time TEXT,
  vessel_name TEXT NOT NULL,
  draft REAL,
  loa REAL,
  dwt REAL,
  gt REAL,
  channel TEXT,
  from_raw TEXT NOT NULL,
  to_raw TEXT NOT NULL,
  from_terminal TEXT,
  to_terminal TEXT,
  agent TEXT,
  pilot TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_port_move_date_type ON port_ship_movements(plan_date,movement_type);
CREATE INDEX IF NOT EXISTS idx_port_move_to_terminal ON port_ship_movements(to_terminal,plan_date,movement_type);

CREATE TABLE IF NOT EXISTS port_ingest_log (
  source_key TEXT PRIMARY KEY,
  last_run_at INTEGER NOT NULL,
  last_ok_at INTEGER,
  last_error TEXT,
  rows_seen INTEGER NOT NULL DEFAULT 0,
  rows_written INTEGER NOT NULL DEFAULT 0
);
