-- Append-only. Next migration is 002_<name>.sql. Tests seed from these files.
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
