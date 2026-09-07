PRAGMA foreign_keys = ON;

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
