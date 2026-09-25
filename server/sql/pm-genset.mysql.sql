CREATE TABLE IF NOT EXISTS pm_genset_evaluations (
  site_id VARCHAR(64) NOT NULL,
  pm_ticket_no VARCHAR(160) NOT NULL,
  pm_period DATE NOT NULL,
  evaluation_status VARCHAR(64) NOT NULL DEFAULT 'Belum dievaluasi',
  follow_up_pic TEXT NOT NULL,
  conclusion TEXT NOT NULL,
  follow_up_action TEXT NOT NULL,
  target_date DATE NULL,
  additional_note TEXT NOT NULL,
  evaluator_user VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(site_id,pm_ticket_no,pm_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
