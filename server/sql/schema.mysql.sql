CREATE TABLE IF NOT EXISTS kpi_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  year SMALLINT NOT NULL,
  month TINYINT NOT NULL,
  day TINYINT NOT NULL,
  dataset JSON NOT NULL,
  uploads JSON NOT NULL,
  history JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kpi_history_run_id (run_id),
  KEY idx_kpi_history_date_end (date_end),
  KEY idx_kpi_history_year_month_day (year, month, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_site_sources (
  source_kind VARCHAR(16) NOT NULL PRIMARY KEY,
  filename VARCHAR(512) NOT NULL,
  upload_date DATE NOT NULL,
  dataset JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_site_evaluations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  site_id VARCHAR(128) NOT NULL,
  pm_ticket_no VARCHAR(128) NOT NULL,
  evaluation_status VARCHAR(64) NOT NULL DEFAULT 'Belum ditinjau',
  priority VARCHAR(16) NOT NULL DEFAULT 'Rendah',
  evaluator_pic VARCHAR(255) NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL,
  follow_up_action TEXT NOT NULL,
  target_date DATE NULL,
  verification_note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pm_site_evaluation (site_id,pm_ticket_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_site_source_rows (
  source_kind VARCHAR(16) NOT NULL,
  row_no INT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  PRIMARY KEY (source_kind,row_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot sumber dipertahankan per upload agar Peningkatan KPI dapat
-- membaca sumber pada bulan yang dipilih, bukan hanya sumber aktif terbaru.
CREATE TABLE IF NOT EXISTS pm_site_source_uploads (
  source_upload_id VARCHAR(64) NOT NULL PRIMARY KEY,
  source_kind VARCHAR(16) NOT NULL,
  filename VARCHAR(512) NOT NULL,
  upload_date DATE NOT NULL,
  dataset JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_pm_site_source_uploads_period (source_kind,upload_date,updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_site_source_upload_rows (
  source_upload_id VARCHAR(64) NOT NULL,
  row_no INT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  PRIMARY KEY (source_upload_id,row_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_upload_history (
  history_order BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
  upload_id VARCHAR(64) NOT NULL PRIMARY KEY,
  page VARCHAR(16) NOT NULL,
  filename VARCHAR(512) NOT NULL,
  upload_date DATE NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_application_upload_page (page,updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS preventive_uploads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  upload_id VARCHAR(64) NOT NULL,
  upload_date DATE NOT NULL,
  filename VARCHAR(512) NOT NULL,
  dataset JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_preventive_upload_id (upload_id),
  KEY idx_preventive_uploads_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
