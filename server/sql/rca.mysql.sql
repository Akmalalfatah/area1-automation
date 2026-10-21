CREATE TABLE IF NOT EXISTS rca_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sheet_name VARCHAR(255) NOT NULL,
  source_updated_at DATETIME NULL,
  synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_count INT UNSIGNED NOT NULL DEFAULT 0,
  dataset JSON NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rca_snapshot_sheet (sheet_name),
  KEY idx_rca_snapshot_updated (source_updated_at,synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
